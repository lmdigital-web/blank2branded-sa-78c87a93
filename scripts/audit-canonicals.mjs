// Diagnostic: fetch each URL and report whether its canonical tag is
// self-referential. Pages that fall through to the SPA fallback return the
// homepage canonical, which tells Google the page is a duplicate of the
// homepage instead of a distinct landing page.
//
// Usage:
//   node scripts/audit-canonicals.mjs                     # audit the live sitemap
//   node scripts/audit-canonicals.mjs 200                 # audit first 200 sitemap URLs
//   node scripts/audit-canonicals.mjs urls.txt            # audit URLs from a file
//
// Exits non-zero if any soft-404s are found, so it can gate a deploy.

import { readFileSync } from "fs";

const SITEMAP = "https://blank2branded.co.za/sitemap.xml";
const arg = process.argv[2];
const concurrency = 8;

const CANON = /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i;

async function urlsFromSitemap() {
  const res = await fetch(SITEMAP);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const all = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const limit = Number(arg);
  return Number.isFinite(limit) && limit > 0 ? all.slice(0, limit) : all;
}

async function check(url) {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();
    const m = html.match(CANON);
    const canonical = m ? m[1] : null;
    const selfRef = !!canonical && canonical.replace(/\/$/, "") === url.replace(/\/$/, "");
    return { url, status: res.status, canonical, selfRef };
  } catch (err) {
    return { url, status: 0, canonical: null, selfRef: false, error: String(err) };
  }
}

const urls = arg && arg.endsWith(".txt") ? readFileSync(arg, "utf8").split("\n").map((l) => l.trim()).filter(Boolean) : await urlsFromSitemap();

const results = [];
let cursor = 0;
async function worker() {
  while (cursor < urls.length) results[cursor++] = await check(urls[cursor - 1]);
}
await Promise.all(Array.from({ length: concurrency }, worker));

const ok = results.filter((r) => r.selfRef);
const bad = results.filter((r) => !r.selfRef);

console.log(`checked:   ${results.length}`);
console.log(`OK (self): ${ok.length}`);
console.log(`SOFT-404:  ${bad.length}\n`);
for (const r of bad) {
  console.log(`${r.url}`);
  console.log(`    status:    ${r.status}`);
  console.log(`    canonical: ${r.canonical ?? "(none)"}${r.error ? `  error: ${r.error}` : ""}\n`);
}

process.exit(bad.length ? 1 : 0);
