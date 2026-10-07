#!/usr/bin/env node
// Repair: restore the storefront-facing `available` and `stock` values that the
// dedupe overwrote with raw Barron supplier quantities.
//
// The dedupe correctly moved the live feed into the dedicated columns
// (supplier_stock_id / supplier_stock_code / supplier_qty_available), but it
// also set `available = (supplier_qty_available > 0)` and
// `stock = supplier_qty_available`. Because most Barron lines are out of stock,
// almost every swatch flipped to disabled and renders at opacity-40, which
// looks to a customer like the colour swatches have vanished.
//
// Sellability is a merchandising decision and belongs to the curated
// catalogue, so it is restored from the backup. The live supplier figures stay
// in the supplier_* columns where the sync can use them.
//
//   node scripts/restore-sellable-flags.mjs --dry
//   node scripts/restore-sellable-flags.mjs
//
// Env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_MANAGEMENT_TOKEN

import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const MGMT = process.env.SUPABASE_MANAGEMENT_TOKEN
const REF = process.env.SUPABASE_PROJECT_REF || "nrdhekbxptagzqasixra"
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }
const dry = process.argv.includes("--dry")

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
  if (!r.ok) throw new Error(`SQL ${r.status}: ${text.slice(0, 600)}`)
  try { return JSON.parse(text) } catch { return text }
}

const dirs = readdirSync(".freebuff").filter((d) => d.startsWith("backup-")).sort()
const dir = join(".freebuff", dirs[dirs.length - 1])
console.log(`backup: ${dir}`)

const beforeProducts = JSON.parse(readFileSync(join(dir, "shop_products.json"), "utf8"))
const beforeVariants = JSON.parse(readFileSync(join(dir, "shop_product_variants.json"), "utf8"))
const afterProducts = await fetchAll("shop_products", "id,handle,title,status")
const afterVariants = await fetchAll("shop_product_variants", "id,product_id,option1_value,option2_value,option3_value,available,stock")

const beforeById = new Map(beforeVariants.map((v) => [v.id, v]))

// index backup variants by (product title key, colour, size, option3) so the
// variants adopted onto previously-empty keepers can find their donor values
const titleKey = (t) => (t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ")
const beforeProductById = new Map(beforeProducts.map((p) => [p.id, p]))
const donorIndex = new Map()
for (const v of beforeVariants) {
  const p = beforeProductById.get(v.product_id)
  if (!p) continue
  const k = [
    titleKey(p.title),
    (v.option1_value || "").trim().toLowerCase(),
    (v.option2_value || "").trim().toLowerCase(),
    (v.option3_value || "").trim().toLowerCase(),
  ].join("|")
  if (!donorIndex.has(k)) donorIndex.set(k, v)
}
const afterProductById = new Map(afterProducts.map((p) => [p.id, p]))

const fixes = []
let fromBackupId = 0
let fromDonor = 0
let unmatched = 0

for (const v of afterVariants) {
  const original = beforeById.get(v.id)
  let src = null
  if (original) {
    src = original
    fromBackupId++
  } else {
    const p = afterProductById.get(v.product_id)
    if (p) {
      const k = [
        titleKey(p.title),
        (v.option1_value || "").trim().toLowerCase(),
        (v.option2_value || "").trim().toLowerCase(),
        (v.option3_value || "").trim().toLowerCase(),
      ].join("|")
      src = donorIndex.get(k)
      if (src) fromDonor++
    }
  }
  if (!src) {
    unmatched++
    continue
  }
  const wantAvailable = src.available === true || src.available === "true"
  const wantStock = src.stock === null || src.stock === undefined ? null : Number(src.stock)
  const haveStock = v.stock === null || v.stock === undefined ? null : Number(v.stock)
  if (v.available === wantAvailable && haveStock === wantStock) continue
  fixes.push({ id: v.id, available: wantAvailable, stock: wantStock })
}

console.log(`\nlive variants:            ${afterVariants.length}`)
console.log(`  matched by original id: ${fromBackupId}`)
console.log(`  matched by donor index: ${fromDonor}`)
console.log(`  unmatched (left as-is): ${unmatched}`)
console.log(`rows needing repair:      ${fixes.length}`)
const toTrue = fixes.filter((f) => f.available).length
console.log(`  -> becoming available:  ${toTrue}`)
console.log(`  -> becoming unavailable: ${fixes.length - toTrue}`)

if (dry) {
  console.log("\ndry run: nothing written")
  process.exit(0)
}
if (!fixes.length) {
  console.log("\nnothing to repair")
  process.exit(0)
}
if (!MGMT) {
  console.error("\nSUPABASE_MANAGEMENT_TOKEN is required to execute")
  process.exit(1)
}

const BATCH = 1000
for (let i = 0; i < fixes.length; i += BATCH) {
  const chunk = fixes.slice(i, i + BATCH)
  const payload = chunk.map((f) => ({ id: f.id, available: f.available, stock: f.stock }))
  await runSql(
    `UPDATE shop_product_variants v
     SET available = r.available,
         stock = r.stock,
         updated_at = now()
     FROM jsonb_to_recordset($json$${JSON.stringify(payload)}$json$::jsonb)
          AS r(id uuid, available boolean, stock integer)
     WHERE v.id = r.id`,
  )
  process.stdout.write(`\r  ${Math.min(i + BATCH, fixes.length)}/${fixes.length}`)
}
process.stdout.write("\n")

const check = await runSql(`
  SELECT
    (SELECT count(*)::int FROM shop_product_variants) AS variants,
    (SELECT count(*)::int FROM shop_product_variants WHERE available) AS available,
    (SELECT count(*)::int FROM shop_product_variants WHERE supplier_qty_available IS NOT NULL) AS with_supplier_qty
`)
console.log("\nafter repair:", check[0])
console.log("supplier feed columns were left untouched.")