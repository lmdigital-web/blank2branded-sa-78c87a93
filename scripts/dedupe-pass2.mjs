#!/usr/bin/env node
// Second dedupe pass: catch duplicates that handle-shape rules miss by
// clustering on the normalised product TITLE (which was identical for 100% of
// the original 1,867 duplicate pairs).
//
//   node scripts/dedupe-pass2.mjs --dry    report remaining title clusters
//   node scripts/dedupe-pass2.mjs --sql    print SQL only
//   node scripts/dedupe-pass2.mjs          execute the merge in a transaction
//
// Env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_MANAGEMENT_TOKEN

import { writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const MGMT = process.env.SUPABASE_MANAGEMENT_TOKEN
const REF = process.env.SUPABASE_PROJECT_REF || "nrdhekbxptagzqasixra"
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }
const dry = process.argv.includes("--dry")
const showSql = process.argv.includes("--sql")
const validate = process.argv.includes("--validate")

async function fetchAll(table, select) {
  const rows = []
  for (let offset = 0; ; offset += 1000) {
    const r = await fetch(`${URL}/rest/v1/${table}?select=${select}&limit=1000&offset=${offset}`, { headers: H })
    if (!r.ok) throw new Error(`${table} ${r.status}: ${await r.text()}`)
    const b = await r.json()
    rows.push(...b)
    if (b.length < 1000) break
  }
  return rows
}
async function runSql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${MGMT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`SQL ${r.status}: ${text.slice(0, 800)}`)
  try { return JSON.parse(text) } catch { return text }
}

// title -> comparable key: lowercase, punctuation to spaces, collapse
const titleKey = (t) => (t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ")
// best URL slug for a title
const slugOf = (t) =>
  (t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

const products = await fetchAll("shop_products", "id,handle,title,supplier_item_number,supplier_stock_header_id")
const variants = await fetchAll("shop_product_variants", "id,product_id,option1_value,option2_value,supplier_qty_available,stock")
const images = await fetchAll("shop_product_images", "id,product_id,url")

const vBy = new Map(), iBy = new Map()
for (const v of variants) { if (!vBy.has(v.product_id)) vBy.set(v.product_id, []); vBy.get(v.product_id).push(v) }
for (const v of images) { if (!iBy.has(v.product_id)) iBy.set(v.product_id, []); iBy.get(v.product_id).push(v) }

const groups = new Map()
for (const p of products) {
  const k = titleKey(p.title)
  if (!k) continue
  if (!groups.has(k)) groups.set(k, [])
  groups.get(k).push(p)
}
const dupes = [...groups.entries()].filter(([, v]) => v.length > 1)

console.log(`published products: ${products.length}`)
console.log(`distinct title keys: ${groups.size}`)
console.log(`title keys with more than one product: ${dupes.length}`)
console.log(`products involved: ${dupes.reduce((a, [, v]) => a + v.length, 0)}\n`)

const richness = (p) => (vBy.get(p.id) || []).length * 100 + (iBy.get(p.id) || []).length * 10
const clusters = []
for (const [tkey, members] of dupes) {
  const ideal = slugOf(members[0].title)
  // Prefer the curated catalogue row (it carries the supplier item number and
  // the branding options); fall back to the row already on the ideal slug, then
  // to the richest. The keeper is renamed to the ideal slug after the donors
  // are deleted, so both SEO and data are kept.
  const ranked = [...members].sort((a, b) => {
    const score = (p) =>
      (p.supplier_item_number ? 1000 : 0) +
      (p.handle === ideal ? 100 : 0) +
      richness(p) / 1e6
    return score(b) - score(a)
  })
  const keeper = ranked[0]
  const donors = ranked.slice(1)
  clusters.push({
    tkey,
    title: members[0].title,
    ideal,
    keeper_id: keeper.id,
    keeper_handle: keeper.handle,
    keeper_needs_rename: keeper.handle !== ideal,
    keeper_hdr: keeper.supplier_stock_header_id ?? donors.map((d) => d.supplier_stock_header_id).find(Boolean) ?? null,
    sku_prefix: keeper.supplier_item_number ?? ideal.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24),
    donor_ids: donors.map((d) => d.id),
    donors: donors.map((d) => ({
      handle: d.handle,
      v: (vBy.get(d.id) || []).length,
      i: (iBy.get(d.id) || []).length,
      sin: d.supplier_item_number,
    })),
    keeperV: (vBy.get(keeper.id) || []).length,
    keeperI: (iBy.get(keeper.id) || []).length,
  })
}

// A keeper may only take the ideal slug if no other surviving keeper holds it.
const keeperHandles = new Set(clusters.map((c) => c.keeper_handle))
let skippedRenames = 0
for (const c of clusters) {
  if (c.keeper_needs_rename && keeperHandles.has(c.ideal)) {
    c.keeper_needs_rename = false
    skippedRenames++
  }
}

console.log("--- clusters ---")
for (const c of clusters) {
  console.log(`\n"${c.title}"`)
  console.log(`   keeper ${c.keeper_handle}  v=${c.keeperV} i=${c.keeperI}${c.keeper_needs_rename ? `  (rename -> ${c.ideal})` : ""}`)
  for (const d of c.donors) console.log(`   donor  ${d.handle}  v=${d.v} i=${d.i} sin=${d.sin || "-"}`)
}

const nDonors = clusters.reduce((a, c) => a + c.donor_ids.length, 0)
const nRenames = clusters.filter((c) => c.keeper_needs_rename).length
console.log(`\nsummary: ${clusters.length} clusters, ${nDonors} products to delete, ${nRenames} handle renames`)
if (skippedRenames) console.log(`note: ${skippedRenames} rename(s) skipped because the ideal slug is held by another keeper`)
console.log(`products after: ${products.length - nDonors}`)

if (dry || showSql) {
  if (showSql) {
    const mapJson = JSON.stringify(clusters)
    console.log("\n----- SQL -----\n" + buildSql(mapJson))
  }
  if (dry) console.log("\ndry run: nothing written")
  process.exit(0)
}

function buildSql(mapJson) {
  return `
BEGIN;

CREATE TEMP TABLE dedupe2_map (
  tkey text PRIMARY KEY,
  ideal text NOT NULL,
  keeper_id uuid NOT NULL,
  keeper_needs_rename boolean NOT NULL,
  keeper_hdr text,
  sku_prefix text NOT NULL,
  donor_ids uuid[] NOT NULL
) ON COMMIT DROP;
INSERT INTO dedupe2_map (tkey, ideal, keeper_id, keeper_needs_rename, keeper_hdr, sku_prefix, donor_ids)
SELECT * FROM jsonb_to_recordset($json$${mapJson}$json$::jsonb)
  AS x(tkey text, ideal text, keeper_id uuid, keeper_needs_rename boolean, keeper_hdr text, sku_prefix text, donor_ids uuid[]);

CREATE TEMP TABLE dedupe2_donor AS
SELECT DISTINCT d AS donor_id FROM dedupe2_map m, unnest(m.donor_ids) d;
CREATE INDEX ON dedupe2_donor(donor_id);

CREATE TEMP TABLE dedupe2_vmatch ON COMMIT DROP AS
SELECT DISTINCT ON (dv.id)
       dv.id AS donor_variant_id,
       kv.id AS keeper_variant_id
FROM dedupe2_map m
JOIN shop_product_variants dv ON dv.product_id = ANY(m.donor_ids)
JOIN LATERAL (
  SELECT k.id FROM shop_product_variants k
  WHERE k.product_id = m.keeper_id
    AND lower(trim(coalesce(k.option1_value,''))) = lower(trim(coalesce(dv.option1_value,'')))
    AND lower(trim(coalesce(k.option2_value,''))) = lower(trim(coalesce(dv.option2_value,'')))
  ORDER BY k.id
  LIMIT 1
) kv ON true;
CREATE INDEX ON dedupe2_vmatch(donor_variant_id);

CREATE TEMP TABLE dedupe2_stock ON COMMIT DROP AS
SELECT vm.keeper_variant_id, dv.supplier_stock_id, dv.supplier_stock_code,
       dv.supplier_qty_available, dv.supplier_sync_updated_at
FROM dedupe2_vmatch vm
JOIN shop_product_variants dv ON dv.id = vm.donor_variant_id;

UPDATE shop_product_variants SET supplier_stock_id = NULL
WHERE product_id IN (SELECT donor_id FROM dedupe2_donor);

UPDATE shop_product_variants kv
SET supplier_stock_id        = s.supplier_stock_id,
    supplier_stock_code      = s.supplier_stock_code,
    supplier_qty_available   = s.supplier_qty_available,
    supplier_sync_updated_at = s.supplier_sync_updated_at,
    stock                    = s.supplier_qty_available,
    available                = (s.supplier_qty_available > 0),
    updated_at               = now()
FROM dedupe2_stock s
WHERE kv.id = s.keeper_variant_id AND s.supplier_qty_available IS NOT NULL;

INSERT INTO shop_product_variants (
  product_id, sku, option1_name, option1_value, option2_name, option2_value,
  option3_name, option3_value, price, currency_code, available, stock,
  image_url, hex_code, position, supplier_stock_id, supplier_stock_code,
  supplier_qty_available, supplier_sync_updated_at, created_at, updated_at
)
SELECT DISTINCT ON (m.keeper_id, lower(trim(coalesce(dv.option1_value,''))), lower(trim(coalesce(dv.option2_value,''))))
  m.keeper_id,
  m.sku_prefix || '-' ||
    trim(both '-' from regexp_replace(coalesce(dv.option1_value,''), '[^A-Za-z0-9]+', '-', 'g')) || '-' ||
    trim(both '-' from regexp_replace(coalesce(dv.option2_value,''), '[^A-Za-z0-9]+', '-', 'g')),
  dv.option1_name, dv.option1_value, dv.option2_name, dv.option2_value,
  dv.option3_name, dv.option3_value, dv.price, dv.currency_code,
  (coalesce(dv.supplier_qty_available, dv.stock, 0) > 0),
  coalesce(dv.supplier_qty_available, dv.stock, 0),
  dv.image_url, dv.hex_code, dv.position,
  dv.supplier_stock_id, dv.supplier_stock_code,
  dv.supplier_qty_available, dv.supplier_sync_updated_at, now(), now()
FROM dedupe2_map m
JOIN shop_product_variants dv ON dv.product_id = ANY(m.donor_ids)
WHERE NOT EXISTS (SELECT 1 FROM shop_product_variants k WHERE k.product_id = m.keeper_id)
ORDER BY m.keeper_id,
         lower(trim(coalesce(dv.option1_value,''))),
         lower(trim(coalesce(dv.option2_value,''))),
         dv.id;

INSERT INTO shop_product_images (product_id, url, alt, position, created_at)
SELECT DISTINCT ON (m.keeper_id, i.url)
  m.keeper_id, i.url, i.alt, i.position, coalesce(i.created_at, now())
FROM dedupe2_map m
JOIN shop_product_images i ON i.product_id = ANY(m.donor_ids)
ORDER BY m.keeper_id, i.url, i.position
ON CONFLICT (product_id, url) DO NOTHING;

UPDATE shop_products SET supplier_stock_header_id = NULL
WHERE id IN (SELECT donor_id FROM dedupe2_donor);

UPDATE shop_products p
SET supplier_stock_header_id = m.keeper_hdr, updated_at = now()
FROM dedupe2_map m
WHERE p.id = m.keeper_id
  AND m.keeper_hdr IS NOT NULL
  AND p.supplier_stock_header_id IS DISTINCT FROM m.keeper_hdr;

DELETE FROM shop_products WHERE id IN (SELECT donor_id FROM dedupe2_donor);

-- Renames run after the delete, so a keeper can claim a slug that a donor held.
UPDATE shop_products p
SET handle = m.ideal, updated_at = now()
FROM dedupe2_map m
WHERE p.id = m.keeper_id AND m.keeper_needs_rename AND p.handle <> m.ideal;

${validate ? "ROLLBACK;" : "COMMIT;"}
`
}

if (!MGMT) {
  console.error("\nSUPABASE_MANAGEMENT_TOKEN is required to execute")
  process.exit(1)
}

const sql = buildSql(JSON.stringify(clusters))
writeFileSync(join(tmpdir(), "dedupe-pass2.sql"), sql)
console.log(`\nSQL: ${join(tmpdir(), "dedupe-pass2.sql")} (${(sql.length / 1024).toFixed(0)} KB)`)
if (validate) console.log("VALIDATE mode: rolling back")

console.log("\nexecuting transaction...")
const t0 = Date.now()
try {
  await runSql(sql)
  console.log(`${validate ? "rolled back" : "committed"} in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
} catch (e) {
  console.error(`\nFAILED: ${e.message}`)
  console.error("the transaction was rolled back; nothing changed")
  process.exit(1)
}

if (!validate) {
  const after = await fetchAll("shop_products", "id,handle,title")
  const g2 = new Map()
  for (const p of after) {
    const k = titleKey(p.title)
    if (!g2.has(k)) g2.set(k, [])
    g2.get(k).push(p)
  }
  const left = [...g2.entries()].filter(([, v]) => v.length > 1)
  console.log(`\nproducts now: ${after.length}`)
  console.log(`remaining title clusters: ${left.length}`)
  for (const [t, v] of left.slice(0, 10)) console.log(`  "${t}" -> ${v.map((x) => x.handle).join(", ")}`)
}