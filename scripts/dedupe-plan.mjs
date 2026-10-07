#!/usr/bin/env node
// Categorise every published product for dedupe and write a reversible plan.
// READ-ONLY with respect to the database: nothing is mutated here.
//
//   node scripts/dedupe-plan.mjs            summary + plan written to os.tmpdir()
//   node scripts/dedupe-plan.mjs --dry      also print SQL preview
//
// Env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY

import { writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!URL || !KEY) {
  console.error("set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (source .env)")
  process.exit(1)
}
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }

async function fetchAll(table, select, extra = "") {
  const rows = []
  for (let offset = 0; ; offset += 1000) {
    const r = await fetch(`${URL}/rest/v1/${table}?select=${select}${extra}&limit=1000&offset=${offset}`, { headers: H })
    if (!r.ok) throw new Error(`${table} ${r.status}: ${await r.text()}`)
    const b = await r.json()
    rows.push(...b)
    if (b.length < 1000) break
  }
  return rows
}

const products = await fetchAll(
  "shop_products",
  "id,handle,title,status,base_price,brand,collection,category_id,supplier_item_number,supplier_stock_header_id,created_at",
  "&status=eq.published",
)
const variants = await fetchAll("shop_product_variants", "id,product_id,sku,option1_value,option2_value,stock,price,supplier_stock_id,supplier_qty_available")
const images = await fetchAll("shop_product_images", "id,product_id,url")
const branding = await fetchAll("shop_product_branding_options", "id,product_id")

const vBy = new Map(), iBy = new Map(), bBy = new Map()
for (const v of variants) { if (!vBy.has(v.product_id)) vBy.set(v.product_id, []); vBy.get(v.product_id).push(v) }
for (const v of images) { if (!iBy.has(v.product_id)) iBy.set(v.product_id, []); iBy.get(v.product_id).push(v) }
for (const v of branding) { if (!bBy.has(v.product_id)) bBy.set(v.product_id, []); bBy.get(v.product_id).push(v) }

const isSuffix = (h) => /-\d+$/.test(h)
// canonical slug shape: collapse repeated dashes, drop a trailing dash,
// then drop the trailing supplier stock code
const keyOf = (h) =>
  h
    .replace(/-{2,}/g, "-")
    .replace(/-+$/, "")
    .replace(/-\d+$/, "")
    .replace(/-+$/, "")

const groups = new Map()
for (const p of products) {
  const k = keyOf(p.handle)
  if (!groups.has(k)) groups.set(k, [])
  groups.get(k).push(p)
}

// Also catch clusters that share a title but not a handle prefix
const byTitle = new Map()
for (const p of products) {
  const t = (p.title || "").trim().toLowerCase()
  if (!t) continue
  if (!byTitle.has(t)) byTitle.set(t, [])
  byTitle.get(t).push(p)
}

const categories = { keepAsIs: [], rename: [], mergeDelete: [], renameAndMerge: [] }

const richness = (p) => {
  const v = (vBy.get(p.id) || []).length, i = (iBy.get(p.id) || []).length, b = (bBy.get(p.id) || []).length
  return { v, i, b, score: v * 100 + i * 10 + b }
}

for (const [key, members] of groups) {
  if (members.length === 1) {
    const p = members[0]
    if (p.handle === key) categories.keepAsIs.push({ id: p.id, handle: p.handle })
    else categories.rename.push({ id: p.id, from: p.handle, to: key, hdr: p.supplier_stock_header_id })
    continue
  }
  // Prefer the row already carrying the exact canonical handle; otherwise the richest row.
  const exact = members.find((p) => p.handle === key)
  const keeper = exact ?? [...members].sort((a, b) => richness(b).score - richness(a).score)[0]
  const rest = members.filter((p) => p.id !== keeper.id)
  const entry = {
    clusterKey: key,
    keeperId: keeper.id,
    keeperHandle: keeper.handle,
    keeperIsCanonical: keeper.handle === key,
    remove: rest.map((p) => ({ id: p.id, handle: p.handle, hdr: p.supplier_stock_header_id })),
    keeperHas: richness(keeper),
  }
  if (exact) categories.mergeDelete.push(entry)
  else categories.renameAndMerge.push(entry)
}

// title-level duplicates NOT already covered (different handle prefixes, same title)
const leftoverTitleDupes = []
for (const [t, members] of byTitle) {
  if (members.length < 2) continue
  const clustersOf = members.map((p) => keyOf(p.handle))
  if (new Set(clustersOf).size === 1) continue
  leftoverTitleDupes.push({ title: t, handles: members.map((p) => p.handle) })
}

const allClusters = [...categories.mergeDelete, ...categories.renameAndMerge]
const nRemove = allClusters.reduce((a, c) => a + c.remove.length, 0)
const nRename = categories.rename.length + categories.renameAndMerge.length
const nFinal = products.length - nRemove

console.log(`published products now: ${products.length}`)
console.log(`products removed:        ${nRemove}`)
console.log(`products remaining:      ${nFinal}\n`)
console.log(`A) keep canonical handle, delete twin(s)    : ${categories.mergeDelete.length} clusters, ${categories.mergeDelete.reduce((a, c) => a + c.remove.length, 0)} rows deleted`)
console.log(`B) rename to canonical handle (sole copy)  : ${categories.rename.length} products`)
console.log(`C) rename keeper + delete twin              : ${categories.renameAndMerge.length} clusters`)
console.log(`D) already canonical, untouched            : ${categories.keepAsIs.length} products`)
console.log(`total handle renames needed                : ${nRename}`)
console.log(`\nleftover same-title clusters with different handle prefixes: ${leftoverTitleDupes.length}`)
for (const d of leftoverTitleDupes.slice(0, 20)) console.log(`   "${d.title}"\n      ${d.handles.join("\n      ")}`)

// data-loss audit for plan A: does the clean keeper lack anything the twin has?
let keeperMissingVariants = 0
let keeperMissingImages = 0
let emptyKeeper = 0
let suffixOnlyHasData = 0
for (const c of allClusters) {
  if (c.keeperHas.v === 0 && c.keeperHas.i === 0) emptyKeeper++
  for (const r of c.remove) {
    const rv = (vBy.get(r.id) || []).length, ri = (iBy.get(r.id) || []).length
    if (rv > 0 && c.keeperHas.v === 0) keeperMissingVariants++
    if (ri > 0 && c.keeperHas.i === 0) keeperMissingImages++
    if (rv > c.keeperHas.v || ri > c.keeperHas.i) suffixOnlyHasData++
  }
}
console.log(`\n--- plan A data-loss audit ---`)
console.log(`  keepers that are completely empty (need variants adopted): ${emptyKeeper}`)
console.log(`  removals carrying variants the keeper lacks:               ${keeperMissingVariants}`)
console.log(`  removals carrying images the keeper lacks:                 ${keeperMissingImages}`)
console.log(`  removals with more data than the keeper:                   ${suffixOnlyHasData}`)

// redirects needed: every removed handle + every renamed-from handle
const redirects = []
for (const c of allClusters) {
  if (!c.keeperIsCanonical) redirects.push({ from: c.keeperHandle, to: c.clusterKey })
  for (const r of c.remove) redirects.push({ from: r.handle, to: c.clusterKey })
}
for (const r of categories.rename) redirects.push({ from: r.from, to: r.to })
const redirectTargets = new Set(redirects.map((r) => r.to))
const collides = redirects.filter((r) => !redirectTargets.has(r.from))

console.log(`
--- redirects required ---`)
console.log(`  removed/renamed-from URLs needing a 301: ${redirects.length}`)
console.log(`  of which the target no longer exists:    ${collides.length}`)

// show what the "empty keeper" products actually look like, so the trade-off is visible
const emptyKeepers = allClusters.filter((c) => c.keeperHas.v === 0 && c.keeperHas.i === 0)
console.log(`
--- sample: keepers with NO variants and NO images (${emptyKeepers.length} clusters) ---`)
for (const c of emptyKeepers.slice(0, 5)) {
  const donor = c.remove[0]
  const dv = (vBy.get(donor.id) || []).slice(0, 3)
  console.log(`  ${c.clusterKey}`)
  console.log(`     keeper "${c.keeperHandle}" price=${products.find((p) => p.id === c.keeperId)?.base_price} v=0 i=0`)
  console.log(`     donor  "${donor.handle}" v=${(vBy.get(donor.id) || []).length} i=${(iBy.get(donor.id) || []).length}`)
  for (const v of dv) {
    console.log(`        ${v.option1_value} / ${v.option2_value}  sku=${v.sku} stock=${v.stock} supplierQty=${v.supplier_qty_available ?? "null"}`)
  }
}

const out = join(tmpdir(), "dedupe-plan.json")
writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), productCount: products.length, removeCount: nRemove, renameCount: nRename, finalCount: nFinal, categories, redirects, leftoverTitleDupes }, null, 2))
console.log(`\nplan written to: ${out}`)