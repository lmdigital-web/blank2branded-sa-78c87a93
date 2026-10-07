#!/usr/bin/env node
// Restore the catalogue tables from a backup directory produced by
// scripts/backup-catalog.mjs, using the Supabase Management API (the anon key
// cannot write to these tables).
//
//   node scripts/restore-catalog.mjs                       # latest backup
//   node scripts/restore-catalog.mjs <backup-dir>           # specific backup
//   node scripts/restore-catalog.mjs <backup-dir> shop_products   # one table
//   node scripts/restore-catalog.mjs <dir> --dry            # show plan only
//
// Uses ON CONFLICT (id) DO UPDATE, so it is idempotent: rows that still exist
// are refreshed, rows deleted by the dedupe are recreated.

import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join } from "node:path"

const MANAGEMENT_TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "nrdhekbxptagzqasixra"
if (!MANAGEMENT_TOKEN) {
  console.error("set SUPABASE_MANAGEMENT_TOKEN to a Supabase Management API token")
  process.exit(1)
}

const TABLES = ["shop_products", "shop_product_variants", "shop_product_images", "shop_product_branding_options"]

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"))
const dry = process.argv.includes("--dry")
const only = args.filter((a) => !a.includes("backup-"))
const dirArg = args.find((a) => a.includes("backup-"))

function latestBackup() {
  const root = ".freebuff"
  if (!existsSync(root)) return null
  const dirs = readdirSync(root).filter((d) => d.startsWith("backup-")).sort()
  if (!dirs.length) return null
  return join(root, dirs[dirs.length - 1])
}

const dir = dirArg || latestBackup()
if (!dir || !existsSync(dir)) {
  console.error(`backup dir not found: ${dir ?? "(none)"}`)
  process.exit(1)
}

const targets = only.length ? only : TABLES
console.log(`restoring from: ${dir}`)
console.log(`tables: ${targets.join(", ")}${dry ? "  (dry run)" : ""}`)

async function runSql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${MANAGEMENT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`SQL ${r.status}: ${text}`)
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const BATCH = 400

for (const table of targets) {
  const file = join(dir, `${table}.json`)
  if (!existsSync(file)) {
    console.error(`  missing ${file}, skipping`)
    continue
  }
  const rows = JSON.parse(readFileSync(file, "utf8"))
  console.log(`\n${table}: ${rows.length} rows`)

  if (dry) {
    console.log(`  would restore in ${Math.ceil(rows.length / BATCH)} batches`)
    continue
  }

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const cols = Object.keys(chunk[0])
    const colList = cols.map((c) => `"${c}"`).join(", ")
    const updates = cols.filter((c) => c !== "id").map((c) => `"${c}" = EXCLUDED."${c}"`).join(", ")
    const payload = chunk.map((r) => {
      const o = {}
      for (const c of cols) o[c] = r[c] === undefined ? null : r[c]
      return o
    })
    const sql =
      `INSERT INTO public.${table} (${colList}) ` +
      `SELECT * FROM jsonb_populate_recordset(null::public.${table}, $json$${JSON.stringify(payload)}$json$) ` +
      `ON CONFLICT (id) DO UPDATE SET ${updates}`
    await runSql(sql)
    process.stdout.write(`\r  ${Math.min(i + BATCH, rows.length)}/${rows.length}`)
  }
  process.stdout.write("\n")

  const [{ count }] = await runSql(`SELECT count(*)::int AS count FROM public.${table}`)
  console.log(`  table now holds ${count} rows`)
}

console.log(dry ? "\ndry run complete, nothing written" : "\nrestore complete")