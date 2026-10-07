#!/usr/bin/env node
// Remove the duplicate products created by the 2026-09-27 Barron feed-preview
// sync, keeping the clean-handle rows and adopting the feed's live stock.
//
//   node scripts/dedupe-migrate.mjs --dry     report what would change
//   node scripts/dedupe-migrate.mjs --sql     print the SQL without running it
//   node scripts/dedupe-migrate.mjs           execute (one transaction)
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

// ---------------------------------------------------------------- plan
console.log("loading catalogue...")
const products = await fetchAll("shop_products", "id,handle,title,supplier_item_number,supplier_stock_header_id,base_price")
const variants = await fetchAll("shop_product_variants", "id,product_id,option1_value,option2_value,supplier_qty_available,stock,available")
const images = await fetchAll("shop_product_images", "id,product_id,url")

const vBy = new Map(), iBy = new Map()
for (const v of variants) { if (!vBy.has(v.product_id)) vBy.set(v.product_id, []); vBy.get(v.product_id).push(v) }
for (const v of images) { if (!iBy.has(v.product_id)) iBy.set(v.product_id, []); iBy.get(v.product_id).push(v) }

const keyOf = (h) => h.replace(/-{2,}/g, "-").replace(/-+$/, "").replace(/-\d+$/, "").replace(/-+$/, "")
const groups = new Map()
for (const p of products) {
  const k = keyOf(p.handle)
  if (!groups.has(k)) groups.set(k, [])
  groups.get(k).push(p)
}
const richness = (p) => (vBy.get(p.id) || []).length * 100 + (iBy.get(p.id) || []).length * 10

const clusters = []
const renames = []
for (const [ckey, members] of groups) {
  if (members.length === 1) {
    const p = members[0]
    if (p.handle !== ckey) renames.push({ id: p.id, from: p.handle, to: ckey })
    continue
  }
  const exact = members.find((p) => p.handle === ckey)
  const keeper = exact ?? [...members].sort((a, b) => richness(b) - richness(a))[0]
  const donors = members.filter((p) => p.id !== keeper.id)
  // the header id must survive on the keeper so future syncs match it
  const keeperHdr = keeper.supplier_stock_header_id ?? donors.map((d) => d.supplier_stock_header_id).find(Boolean) ?? null
  clusters.push({
    ckey,
    keeper_id: keeper.id,
    keeper_hdr: keeperHdr,
    sku_prefix: keeper.supplier_item_number ?? ckey.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24),
    donor_ids: donors.map((d) => d.id),
    donor_handles: donors.map((d) => d.handle),
    keeper_handle: keeper.handle,
  })
}

// expected effects (computed locally for the dry-run report)
let expectDeleted = 0, expectImages = 0, expectAdoptVariants = 0, expectStockUpdates = 0, droppedDonorVariants = 0
for (const c of clusters) {
  expectDeleted += c.donor_ids.length
  const kv = vBy.get(c.keeper_id) || []
  const ki = new Set((iBy.get(c.keeper_id) || []).map((x) => x.url))
  const sigs = new Set(kv.map((v) => `${(v.option1_value || "").trim().toLowerCase()}|${(v.option2_value || "").trim().toLowerCase()}`))
  const keeperEmpty = kv.length === 0
  for (const d of c.donor_ids) {
    for (const img of iBy.get(d) || []) if (!ki.has(img.url)) expectImages++
    const dv = vBy.get(d) || []
    if (keeperEmpty) { expectAdoptVariants += dv.length; continue }
    for (const v of dv) {
      const s = `${(v.option1_value || "").trim().toLowerCase()}|${(v.option2_value || "").trim().toLowerCase()}`
      if (sigs.has(s)) { expectStockUpdates++; sigs.delete(s) }
      else droppedDonorVariants++
    }
  }
}

console.log(`\n=== plan ===`)
console.log(`products deleted:            ${expectDeleted}`)
console.log(`handles renamed:             ${clusters.filter((c) => c.keeper_handle !== c.ckey).length + renames.length}`)
console.log(`donor images adopted:        ${expectImages}`)
console.log(`variants adopted (empty keepers): ${expectAdoptVariants}`)
console.log(`variants given live stock:   ${expectStockUpdates}`)
console.log(`donor variants dropped:      ${droppedDonorVariants}  (colour/size not in the curated range)`)
console.log(`products remaining:         ${products.length - expectDeleted}`)

// ---------------------------------------------------------------- sql
const mapJson = JSON.stringify(clusters)
// the SQL expects a `new_handle` column, so map `to` across
const renameJson = JSON.stringify(renames.map((r) => ({ id: r.id, new_handle: r.to })))

const sql = `
BEGIN;

-- keeper <-> donor map, computed and verified in Node
CREATE TEMP TABLE dedupe_map (
  ckey text PRIMARY KEY,
  keeper_id uuid NOT NULL,
  keeper_hdr text,
  sku_prefix text NOT NULL,
  donor_ids uuid[] NOT NULL
) ON COMMIT DROP;
INSERT INTO dedupe_map (ckey, keeper_id, keeper_hdr, sku_prefix, donor_ids)
SELECT * FROM jsonb_to_recordset($json$${mapJson}$json$::jsonb)
  AS x(ckey text, keeper_id uuid, keeper_hdr text, sku_prefix text, donor_ids uuid[]);

CREATE TEMP TABLE dedupe_donor AS
SELECT DISTINCT d AS donor_id FROM dedupe_map m, unnest(m.donor_ids) d;
CREATE INDEX ON dedupe_donor(donor_id);

-- sole-copy products whose handle needs normalising
CREATE TEMP TABLE dedupe_rename (id uuid PRIMARY KEY, new_handle text NOT NULL) ON COMMIT DROP;
INSERT INTO dedupe_rename (id, new_handle)
SELECT * FROM jsonb_to_recordset($json$${renameJson}$json$::jsonb) AS x(id uuid, new_handle text);

-- 1. pair each donor variant with the keeper variant of the same colour + size
CREATE TEMP TABLE dedupe_vmatch ON COMMIT DROP AS
SELECT DISTINCT ON (dv.id)
       dv.id AS donor_variant_id,
       kv.id AS keeper_variant_id
FROM dedupe_map m
JOIN shop_product_variants dv ON dv.product_id = ANY(m.donor_ids)
JOIN LATERAL (
  SELECT k.id FROM shop_product_variants k
  WHERE k.product_id = m.keeper_id
    AND lower(trim(coalesce(k.option1_value,''))) = lower(trim(coalesce(dv.option1_value,'')))
    AND lower(trim(coalesce(k.option2_value,''))) = lower(trim(coalesce(dv.option2_value,'')))
  ORDER BY k.id
  LIMIT 1
) kv ON true;
CREATE INDEX ON dedupe_vmatch(donor_variant_id);

-- 2. snapshot the live feed stock before the donors are emptied
CREATE TEMP TABLE dedupe_stock ON COMMIT DROP AS
SELECT vm.keeper_variant_id,
       dv.supplier_stock_id,
       dv.supplier_stock_code,
       dv.supplier_qty_available,
       dv.supplier_sync_updated_at
FROM dedupe_vmatch vm
JOIN shop_product_variants dv ON dv.id = vm.donor_variant_id;

-- 3. release the unique supplier_stock_id values held by donors
UPDATE shop_product_variants SET supplier_stock_id = NULL
WHERE product_id IN (SELECT donor_id FROM dedupe_donor);

-- 4. adopt live Barron stock onto the matching keeper variants
UPDATE shop_product_variants kv
SET supplier_stock_id       = s.supplier_stock_id,
    supplier_stock_code     = s.supplier_stock_code,
    supplier_qty_available  = s.supplier_qty_available,
    supplier_sync_updated_at = s.supplier_sync_updated_at,
    stock                   = s.supplier_qty_available,
    available               = (s.supplier_qty_available > 0),
    updated_at              = now()
FROM dedupe_stock s
WHERE kv.id = s.keeper_variant_id
  AND s.supplier_qty_available IS NOT NULL;

-- 5. keepers with no variants at all: adopt the donor colourways
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
FROM dedupe_map m
JOIN shop_product_variants dv ON dv.product_id = ANY(m.donor_ids)
WHERE NOT EXISTS (SELECT 1 FROM shop_product_variants k WHERE k.product_id = m.keeper_id)
ORDER BY m.keeper_id,
         lower(trim(coalesce(dv.option1_value,''))),
         lower(trim(coalesce(dv.option2_value,''))),
         dv.id;

-- 6. adopt donor images the keeper does not already have
INSERT INTO shop_product_images (product_id, url, alt, position, created_at)
SELECT DISTINCT ON (m.keeper_id, i.url)
  m.keeper_id, i.url, i.alt, i.position, coalesce(i.created_at, now())
FROM dedupe_map m
JOIN shop_product_images i ON i.product_id = ANY(m.donor_ids)
ORDER BY m.keeper_id, i.url, i.position
ON CONFLICT (product_id, url) DO NOTHING;

-- 7. release the unique supplier_stock_header_id held by donors
UPDATE shop_products SET supplier_stock_header_id = NULL
WHERE id IN (SELECT donor_id FROM dedupe_donor);

-- 8. hand the header id to the keeper so future supplier syncs match it
UPDATE shop_products p
SET supplier_stock_header_id = m.keeper_hdr,
    updated_at = now()
FROM dedupe_map m
WHERE p.id = m.keeper_id
  AND m.keeper_hdr IS NOT NULL
  AND p.supplier_stock_header_id IS DISTINCT FROM m.keeper_hdr;

-- 9. normalise handles on the surviving products
UPDATE shop_products p
SET handle = m.ckey, updated_at = now()
FROM dedupe_map m
WHERE p.id = m.keeper_id AND p.handle <> m.ckey;

UPDATE shop_products p
SET handle = r.new_handle, updated_at = now()
FROM dedupe_rename r
WHERE p.id = r.id AND p.handle <> r.new_handle;

-- 10. remove the duplicates (variants, images and branding cascade)
DELETE FROM shop_products WHERE id IN (SELECT donor_id FROM dedupe_donor);

COMMIT;
`

writeFileSync(join(tmpdir(), "dedupe-migration.sql"), sql)
console.log(`\nSQL written to ${join(tmpdir(), "dedupe-migration.sql")} (${(sql.length / 1024).toFixed(0)} KB)`)

if (showSql) {
  console.log("\n----- SQL -----\n" + sql)
  process.exit(0)
}

if (dry) {
  console.log("\ndry run: nothing written")
  process.exit(0)
}

// Validation runs the identical transaction but ends in ROLLBACK, so every
// statement is parsed and executed against real data without persisting it.
const validate = process.argv.includes("--validate")
const sqlToRun = validate ? sql.replace("COMMIT;", "ROLLBACK;") : sql
if (validate) console.log("\nVALIDATE mode: running the migration, then rolling back")

if (!MGMT) {
  console.error("\nSUPABASE_MANAGEMENT_TOKEN is required to execute")
  process.exit(1)
}

console.log("\nexecuting transaction...")
const t0 = Date.now()
try {
  const res = await runSql(sqlToRun)
  console.log(`${validate ? "rolled back" : "committed"} in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  console.log("result:", JSON.stringify(res).slice(0, 400))
} catch (e) {
  console.error(`\nFAILED: ${e.message}`)
  console.error("the transaction was rolled back; nothing changed")
  process.exit(1)
}

// ---------------------------------------------------------------- verify
console.log("\n=== verification ===")
const v = await runSql(`
  SELECT
    (SELECT count(*)::int FROM shop_products WHERE status='published') AS published,
    (SELECT count(*)::int FROM shop_products) AS all_products,
    (SELECT count(*)::int FROM shop_products WHERE handle LIKE '%--%') AS double_dash_handles,
    (SELECT count(*)::int FROM shop_products WHERE handle ~ '-[0-9]+$') AS suffixed_handles,
    (SELECT count(*)::int FROM shop_products WHERE supplier_stock_header_id IS NOT NULL) AS products_with_stock_header,
    (SELECT count(*)::int FROM shop_product_variants) AS variants,
    (SELECT count(*)::int FROM shop_product_variants WHERE supplier_stock_id IS NOT NULL) AS variants_with_live_stock,
    (SELECT count(*)::int FROM shop_product_variants WHERE available) AS available_variants,
    (SELECT count(*)::int FROM shop_product_images) AS images,
    (SELECT count(*)::int FROM shop_product_branding_options) AS branding_options
`)
console.log(v)

const dupes = await runSql(`
  SELECT ck2, count(*) AS copies, array_agg(handle ORDER BY handle) AS handles
  FROM (
    SELECT id, handle,
           replace(regexp_replace(handle, '-{2,}', '-', 'g'), '-+$', '') AS ck,
           regexp_replace(replace(regexp_replace(handle, '-{2,}', '-', 'g'), '-+$', ''), '-[0-9]+$', '') AS ck2
    FROM shop_products WHERE status = 'published'
  ) x
  GROUP BY ck2 HAVING count(*) > 1
`)
console.log(`remaining duplicate clusters: ${Array.isArray(dupes) ? dupes.length : JSON.stringify(dupes)}`)
if (Array.isArray(dupes) && dupes.length) console.log(dupes.slice(0, 10))