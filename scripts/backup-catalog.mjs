#!/usr/bin/env node
// Full backup of the catalogue tables before the duplicate removal.
// Writes JSON dumps + a restore helper into .freebuff/backup-<timestamp>/
// (.freebuff is untracked and must never be committed).
//
//   node scripts/backup-catalog.mjs
//
// Env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY

import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!URL || !KEY) {
  console.error("set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (source .env)")
  process.exit(1)
}
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }

async function fetchAll(table) {
  const rows = []
  for (let offset = 0; ; offset += 1000) {
    const r = await fetch(`${URL}/rest/v1/${table}?select=*&limit=1000&offset=${offset}`, { headers: H })
    if (!r.ok) throw new Error(`${table} ${r.status}: ${await r.text()}`)
    const b = await r.json()
    rows.push(...b)
    process.stdout.write(`\r  ${table}: ${rows.length}`)
    if (b.length < 1000) break
  }
  process.stdout.write("\n")
  return rows
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-")
const dir = join(".freebuff", `backup-${stamp}`)
mkdirSync(dir, { recursive: true })
console.log(`backup dir: ${dir}`)

const manifest = { createdAt: new Date().toISOString(), project: URL, tables: {} }

for (const table of ["shop_products", "shop_product_variants", "shop_product_images", "shop_product_branding_options"]) {
  const rows = await fetchAll(table)
  const file = join(dir, `${table}.json`)
  writeFileSync(file, JSON.stringify(rows, null, 0))
  manifest.tables[table] = { rows: rows.length, file }
  console.log(`  wrote ${file} (${rows.length} rows)`)
}

writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2))
writeFileSync(
  join(dir, "RESTORE.md"),
  [
    "# Catalogue backup",
    "",
    `Taken ${manifest.createdAt} from ${URL}`,
    "",
    "## Restore a single table via PostgREST",
    "",
    "```bash",
    `export $(grep -E '^VITE_SUPABASE_URL=|^VITE_SUPABASE_PUBLISHABLE_KEY=' .env | xargs)`,
    "for o in $(seq 0 1000 60000); do",
    `  head -c $(( ${'$'}(wc -c < FILE) )) FILE | tail -c +$((o+1)) | head -c 100000000 > /tmp/chunk.json`,
    "  break",
    "done",
    "```",
    "",
    "## Preferred restore path",
    "",
    "Use the Supabase Management API (`POST /v1/projects/nrdhekbxptagzqasixra/database/query`)",
    "and load the JSON with `pg_read_file` / `json_to_recordset` from a COPY, or simply",
    "re-insert via PostgREST in batches of 1000 rows.",
    "",
    "The anon key cannot write to these tables, so use the Management API token.",
    "",
  ].join("\n"),
)
console.log(`\nmanifest: ${join(dir, "manifest.json")}`)