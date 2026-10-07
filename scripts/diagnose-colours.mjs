#!/usr/bin/env node
// Diagnose the colour-swatch regression: compare distinct colour counts per
// product before (backup) vs after (live), matching on product title.
//
//   node scripts/diagnose-colours.mjs
//
// Env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY

import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }

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

const dirs = readdirSync(".freebuff").filter((d) => d.startsWith("backup-")).sort()
const dir = join(".freebuff", dirs[dirs.length - 1])
console.log(`backup: ${dir}`)

const beforeProducts = JSON.parse(readFileSync(join(dir, "shop_products.json"), "utf8"))
const beforeVariants = JSON.parse(readFileSync(join(dir, "shop_product_variants.json"), "utf8"))
const afterProducts = await fetchAll("shop_products", "id,handle,title,status")
const afterVariants = await fetchAll("shop_product_variants", "id,product_id,option1_name,option1_value,option2_name,option2_value,available,stock,supplier_qty_available,hex_code")

const isColourVariant = (v) => /colou?r/i.test(v.option1_name || "")
const colourStats = (variants, byProduct) => {
  const m = new Map()
  for (const v of variants) {
    const pid = byProduct(v)
    if (!pid) continue
    if (!isColourVariant(v)) continue
    const key = (v.option1_value || "").trim()
    if (!m.has(pid)) m.set(pid, { total: new Set(), available: new Set() })
    m.get(pid).total.add(key)
    if (v.available) m.get(pid).available.add(key)
  }
  return m
}

const bpId = new Map(beforeProducts.map((p) => [p.id, p]))
const beforeStats = colourStats(beforeVariants, (v) => v.product_id)
const afterStats = colourStats(afterVariants, (v) => v.product_id)

const titleKey = (t) => (t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ")
// best-effort: match a live product to the backup row with the same title
const beforeByTitle = new Map()
for (const p of beforeProducts) {
  const k = titleKey(p.title)
  if (!beforeByTitle.has(k)) beforeByTitle.set(k, [])
  beforeByTitle.get(k).push(p)
}

let droppedTotal = 0
let droppedAvail = 0
const worst = []
let checked = 0
for (const p of afterProducts) {
  const k = titleKey(p.title)
  const cands = beforeByTitle.get(k) || []
  if (!cands.length) continue
  // the backup row for this title with the most colours
  let best = null
  for (const c of cands) {
    const s = beforeStats.get(c.id)
    if (!s) continue
    if (!best || s.total.size > best.total.size) best = s
  }
  if (!best) continue
  const now = afterStats.get(p.id)
  const nowTotal = now ? now.total.size : 0
  const nowAvail = now ? now.available.size : 0
  checked++
  if (nowTotal < best.total.size) {
    droppedTotal++
    worst.push({ handle: p.handle, before: best.total.size, after: nowTotal, beforeAvail: best.available.size, afterAvail: nowAvail })
  }
  if (nowAvail < best.available.size) droppedAvail++
}

console.log(`\nproducts compared: ${checked}`)
console.log(`products where distinct colours DROPPED: ${droppedTotal}`)
console.log(`products where distinct AVAILABLE colours dropped: ${droppedAvail}`)

worst.sort((a, b) => b.before - b.before || (a.before - a.after) - (b.before - b.after))
console.log(`\nlargest drops (first 20):`)
for (const w of worst.slice(0, 20)) {
  console.log(`  ${String(w.before).padStart(4)} -> ${String(w.after).padStart(3)}  ${w.handle}`)
}

// overall availability picture
const avail = afterVariants.filter((v) => isColourVariant(v))
console.log(`\ncolour variants: ${avail.length}, available: ${avail.filter((v) => v.available).length}`)
const withQty = avail.filter((v) => v.supplier_qty_available !== null)
console.log(`colour variants with supplier qty: ${withQty.length}, of those qty>0: ${withQty.filter((v) => v.supplier_qty_available > 0).length}`)

// products whose colours are all unavailable except one
let oneColour = 0
let oneAvailable = 0
for (const p of afterProducts) {
  const s = afterStats.get(p.id)
  if (!s) continue
  if (s.total.size === 1) oneColour++
  if (s.available.size === 1 && s.total.size > 1) oneAvailable++
}
console.log(`\nproducts with exactly 1 distinct colour: ${oneColour}`)
console.log(`products with >1 colour but only 1 available: ${oneAvailable}`)