#!/usr/bin/env node
// Verify the requested SEO elements across the built static output.
// Usage: node scripts/verify-seo.mjs <dist-dir>

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs"
import { join } from "node:path"

const dist = process.argv[2] || "dist"
const BASE = "https://blank2branded.co.za"
let pass = 0
let fail = 0
const failures = []

function check(name, ok, detail = "") {
  if (ok) {
    pass++
  } else {
    fail++
    failures.push(`${name}${detail ? " — " + detail : ""}`)
  }
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.name === "index.html") out.push(p)
  }
  return out
}

const pages = walk(dist)
// Normalise Windows separators: join() yields backslashes, which would corrupt
// both the route and the on-disk lookups.
const rel = (p) => {
  const parts = p.split(/[\\/]/).filter(Boolean) // e.g. ['dist','about','index.html']
  parts.shift() // drop the dist dir
  if (parts[parts.length - 1] === "index.html") parts.pop()
  return parts.length ? "/" + parts.join("/") + "/" : "/"
}
const pick = (html, re) => html.match(re)?.[1] ?? null

console.log(`checking ${pages.length} prerendered pages in ${dist}\n`)

// ---- 1. OG image assets actually exist --------------------------------------
for (const f of ["og-default.png", "og-image.png"]) {
  const p = join(dist, f)
  const ok = existsSync(p) && statSync(p).size > 1000
  check(`asset ${f} exists and is non-trivial`, ok, ok ? "" : "missing or empty")
  if (ok) {
    const b = readFileSync(p)
    const isPng = b.slice(0, 8).toString("hex") === "89504e470d0a1a0a"
    const w = b.readUInt32BE(16)
    const h = b.readUInt32BE(20)
    check(`${f} is a valid 1200x630 PNG`, isPng && w === 1200 && h === 630, `${w}x${h} png=${isPng}`)
  }
}

// ---- 2. per-page checks -----------------------------------------------------
const problems = { title: [], desc: [], canon: [], og: [], h1: [], slug: [] }
const seenTitles = new Map()
let ogImageDead = 0
let withDimensions = 0
let withImageAlt = 0

for (const p of pages) {
  const html = readFileSync(p, "utf8")
  const route = rel(p)

  const title = pick(html, /<title>([^<]*)<\/title>/i)
  const desc = pick(html, /<meta\s+name="description"\s+content="([^"]*)"/i)
  const canon = pick(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i)
  const ogTitle = pick(html, /<meta\s+property="og:title"\s+content="([^"]*)"/i)
  const ogDesc = pick(html, /<meta\s+property="og:description"\s+content="([^"]*)"/i)
  const ogUrl = pick(html, /<meta\s+property="og:url"\s+content="([^"]*)"/i)
  const ogImage = pick(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i)

  if (!title) problems.title.push(route)
  else {
    const prev = seenTitles.get(title)
    if (prev && !route.startsWith("/blog/")) seenTitles.set(title, prev + "|" + route)
    else if (!prev) seenTitles.set(title, route)
  }
  if (!desc) problems.desc.push(route)
  if (!canon) problems.canon.push(route)
  if (!ogTitle || !ogDesc || !ogUrl || !ogImage) problems.og.push(route)

  // canonical must be self-referential
  if (canon && canon.replace(/\/$/, "") !== (BASE + route).replace(/\/$/, "")) {
    problems.canon.push(`${route} -> ${canon}`)
  }

  // og:image must resolve to a real file (site-relative) or an absolute URL
  if (ogImage && ogImage.includes("/og-default.png")) {
    withDimensions += /og:image:width/.test(html) ? 1 : 0
    withImageAlt += /og:image:alt/.test(html) ? 1 : 0
    if (!existsSync(join(dist, "og-default.png"))) ogImageDead++
  }

  // exactly one h1 in the crawler-visible markup
  const h1s = (html.match(/<h1[\s>]/gi) || []).length
  if (h1s !== 1) problems.h1.push(`${route} (${h1s})`)

  // clean slug: lowercase, dash separated, no double dashes, no trailing dash
  const seg = route.split("/").filter(Boolean)
  for (const s of seg) {
    if (s === "blog" || s === "products" || s === "shop" || s === "local" || s === "vs") continue
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)) problems.slug.push(`${route} (segment "${s}")`)
  }
}

check("every page has a <title>", problems.title.length === 0, problems.title.slice(0, 5).join(", "))
check("every page has a meta description", problems.desc.length === 0, problems.desc.slice(0, 5).join(", "))
check("every page has a self-referential canonical", problems.canon.length === 0, problems.canon.slice(0, 5).join(", "))
check("every page has og:title/description/url/image", problems.og.length === 0, problems.og.slice(0, 5).join(", "))
check("exactly one <h1> per page", problems.h1.length === 0, problems.h1.slice(0, 8).join(", "))
check("clean URL slugs", problems.slug.length === 0, problems.slug.slice(0, 5).join(", "))
check("no dead og:image fallback", ogImageDead === 0, `${ogImageDead} pages`)
check("fallback og:image declares width/height", withDimensions > 0, `${withDimensions} pages`)
check("og:image has :alt", withImageAlt > 0, `${withImageAlt} pages`)

// duplicate titles across non-blog pages
const dupes = [...seenTitles.entries()].filter(([, v]) => v.includes("|"))
check("no duplicate titles across non-blog pages", dupes.length === 0, dupes.slice(0, 3).map(([t, v]) => `${t} (${v})`).join("; "))

// ---- 3. the three previously-soft-404 routes --------------------------------
for (const route of ["/returns/", "/shop/apparel/", "/shop/corporate/"]) {
  const f = join(dist, ...route.split("/").filter(Boolean), "index.html")
  const exists = existsSync(f)
  check(`${route} is prerendered`, exists)
  if (exists) {
    const html = readFileSync(f, "utf8")
    const canon = pick(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i)
    check(`${route} canonical is self-referential`, canon === BASE + route, canon || "none")
    const title = pick(html, /<title>([^<]*)<\/title>/i)
    check(`${route} has a unique title`, !!title && title !== pick(readFileSync(join(dist, "index.html"), "utf8"), /<title>([^<]*)<\/title>/i))
  }
}

// ---- 4. LocalBusiness JSON-LD ----------------------------------------------
const home = readFileSync(join(dist, "index.html"), "utf8")
const lb = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []
const parsed = lb.map((s) => JSON.parse(s.replace(/<script[^>]*>/, "").replace(/<\/script>/, "")))
const local = parsed.find((j) => j["@type"] === "LocalBusiness")
check("homepage has LocalBusiness JSON-LD", !!local)
if (local) {
  check("LocalBusiness name", local.name === "Blank2Branded")
  check("LocalBusiness locality is Mbombela", local.address?.addressLocality === "Mbombela")
  check("LocalBusiness region is Mpumalanga", local.address?.addressRegion === "Mpumalanga")
  check("LocalBusiness country is ZA", local.address?.addressCountry === "ZA")
  check("LocalBusiness has geo coordinates", !!local.geo?.latitude && !!local.geo?.longitude)
  check("LocalBusiness telephone is a real number", /^\+?\d{9,15}$/.test(String(local.telephone || "")), String(local.telephone))
  check("LocalBusiness image resolves", existsSync(join(dist, "og-image.png")))
  check("LocalBusiness alternateName mentions Nelspruit", String(local.alternateName || "").includes("Nelspruit"))
}
const site = parsed.find((j) => j["@type"] === "WebSite")
check("homepage has WebSite JSON-LD", !!site)

// every page carries LocalBusiness (it is in the shared shell)
const noLb = pages.filter((p) => !/"@type":\s*"LocalBusiness"/.test(readFileSync(p, "utf8")))
check("LocalBusiness present on every page", noLb.length === 0, `${noLb.length} pages missing`)

// ---- 5. sitemap + robots ----------------------------------------------------
const sm = readFileSync(join(dist, "sitemap.xml"), "utf8")
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
check("sitemap.xml is generated", urls.length > 0, `${urls.length} urls`)
for (const route of ["/returns/", "/shop/apparel/", "/shop/corporate/", "/privacy/", "/terms/"]) {
  check(`sitemap contains ${route}`, urls.includes(route))
}
const noPage = urls.filter((u) => {
  const f = join(dist, ...u.split("/").filter(Boolean), "index.html")
  return !existsSync(f)
})
check("every sitemap URL has a prerendered page", noPage.length === 0, noPage.slice(0, 5).join(", "))

const robots = readFileSync(join(dist, "robots.txt"), "utf8")
check("robots.txt references the sitemap", /Sitemap:\s*https?:\/\/blank2branded\.co\.za\/sitemap\.xml/i.test(robots))
check("robots.txt disallows admin", /Disallow:\s*\/admin/i.test(robots))

// ---- 6. images: alt text ----------------------------------------------------
let imgs = 0
let noAlt = 0
const missingAlt = []
for (const p of pages) {
  const html = readFileSync(p, "utf8")
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    // 1x1 tracking pixels (the Meta Pixel noscript fallback) are not content
    // images and must not carry alt text.
    if (/width="1"/.test(m[0]) && /height="1"/.test(m[0])) continue
    imgs++
    if (!/\balt=/i.test(m[0])) {
      noAlt++
      if (missingAlt.length < 5) missingAlt.push(`${rel(p)}: ${m[0].slice(0, 70)}`)
    }
  }
}
check("every content <img> has an alt attribute", noAlt === 0, `${noAlt} of ${imgs} — ${missingAlt.join(" | ")}`)

// Conflicting robots directives are flagged by Google and read wrongly by
// tooling, so the static html must ship exactly one tag.
let dupRobots = 0
const dupList = []
for (const p of pages) {
  const n = (readFileSync(p, "utf8").match(/<meta\s+name="robots"/gi) || []).length
  if (n !== 1) {
    dupRobots++
    if (dupList.length < 5) dupList.push(`${rel(p)}: ${n} robots tags`)
  }
}
check("every page has exactly one robots meta tag", dupRobots === 0, dupList.join(" | "))

// ---- 7. service pages -------------------------------------------------------
// /services/:slug/ must be a complete, crawler-visible landing page: every
// section the template promises, an FAQPage schema in the STATIC html (not
// just injected at runtime), and a quote CTA both above the fold and at the
// bottom.
const serviceDir = join(dist, "services")
const serviceSlugs = existsSync(serviceDir)
  ? readdirSync(serviceDir).filter((d) => existsSync(join(serviceDir, d, "index.html")))
  : []

check("service pages were prerendered", serviceSlugs.length > 0, `${serviceSlugs.length} found`)

for (const slug of serviceSlugs) {
  const html = readFileSync(join(serviceDir, slug, "index.html"), "utf8")
  const where = `services/${slug}`
  const count = (re) => (html.match(re) || []).length

  check(`${where}: slug is clean`, /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))
  check(`${where}: exactly one h1`, count(/<h1[ >]/g) === 1, `${count(/<h1[ >]/g)}`)
  const canon = pick(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i)
  check(
    `${where}: canonical is self-referential`,
    canon === `${BASE}/services/${slug}/`,
    canon || "none",
  )
  check(`${where}: has a meta description`, count(/<meta name="description" content="[^"]{50,}"/g) === 1)
  check(`${where}: has a keyword focus term`, count(/<meta name="keywords" content="[^"]{20,}"/g) === 1)
  check(`${where}: has a short intro`, /Our Services<\/p>/.test(html))

  // sections
  check(`${where}: benefits section`, /Why choose/.test(html))
  check(`${where}: 4 process steps`, count(/Step \d: /g) === 4, `${count(/Step \d: /g)}`)
  check(
    `${where}: process steps in order`,
    ["Enquire", "Design proof", "Production", "Delivery"].every((t) => html.includes(t)),
  )
  check(`${where}: FAQ section`, count(/<details/g) >= 3, `${count(/<details/g)} faqs`)
  check(`${where}: related services block`, /Related services/.test(html))
  check(`${where}: blog links block`, /Read all articles/.test(html))

  // CTA above the fold and again at the bottom
  check(`${where}: two quote forms (top + bottom)`, count(/<form/g) === 2, `${count(/<form/g)}`)
  check(`${where}: two "Request a Quote" buttons`, count(/Request a Quote/g) >= 2, `${count(/Request a Quote/g)}`)
  check(`${where}: WhatsApp CTA above the fold and at the bottom`, count(/wa\.me\/27698384045/g) >= 2, `${count(/wa\.me\/27698384045/g)}`)

  // schema must be in the static HTML a crawler sees
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => { try { return JSON.parse(m[1]) } catch { return null } })
    .filter(Boolean)
  const types = ld.map((o) => o["@type"])
  // Exactly the per-page scripts carry the marker, so the runtime route can
  // clear and re-inject them instead of leaving a duplicated set in <head>.
  const marked = [...html.matchAll(
    /<script type="application\/ld\+json" data-service-ld>([\s\S]*?)<\/script>/g,
  )]
  check(
    `${where}: per-page JSON-LD carries the hydration dedupe marker`,
    marked.length === 3,
    `${marked.length} marked (want WebPage + Service + FAQPage)`,
  )
  check(`${where}: WebPage JSON-LD in static html`, types.includes("WebPage"))
  check(`${where}: Service JSON-LD in static html`, types.includes("Service"))
  const faqLd = ld.find((o) => o["@type"] === "FAQPage")
  check(`${where}: FAQPage JSON-LD in static html`, !!faqLd)
  if (faqLd) {
    const questions = (faqLd.mainEntity || []).map((q) => q.name)
    const rendered = count(/<details/g)
    check(
      `${where}: FAQPage questions match rendered FAQs`,
      questions.length === rendered && questions.length > 0,
      `${questions.length} schema vs ${rendered} rendered`,
    )
  }
  // Every visible form field must have a matching id so its <label for> works.
  // Two forms render per page, so ids have to be unique across the document.
  const ids = [...html.matchAll(/<input[^>]*id="([^"]+)"/g)].map((m) => m[1])
    .concat([...html.matchAll(/<textarea[^>]*id="([^"]+)"/g)].map((m) => m[1]))
    .concat([...html.matchAll(/<select[^>]*id="([^"]+)"/g)].map((m) => m[1]))
  check(
    `${where}: form field ids are unique`,
    new Set(ids).size === ids.length,
    `${ids.length} ids, ${new Set(ids).size} unique`,
  )
  const fors = [...html.matchAll(/<label[^>]*for="([^"]+)"/g)].map((m) => m[1])
  check(
    `${where}: every label points at a real field`,
    fors.every((f) => ids.includes(f)),
    fors.filter((f) => !ids.includes(f)).join(", "),
  )

  // every internal link in the body must resolve to a real prerendered page
  const hrefs = [...html.matchAll(/<a href="(\/[^"#?]*)\/?"/g)].map((m) => m[1])
  const broken = [...new Set(hrefs)].filter((h) => {
    if (!existsSync(join(dist, ...h.split("/").filter(Boolean), "index.html"))) return true
    return false
  })
  check(`${where}: all internal links resolve`, broken.length === 0, broken.join(", "))
}

check(
  "sitemap contains every service page",
  serviceSlugs.every((s) => urls.includes(`/services/${s}/`)),
  serviceSlugs.filter((s) => !urls.includes(`/services/${s}/`)).join(", "),
)

// ---- report -----------------------------------------------------------------
console.log(`PASS ${pass}   FAIL ${fail}\n`)
if (failures.length) {
  console.log("FAILURES:")
  for (const f of failures) console.log("  x " + f)
  process.exit(1)
}
console.log("All SEO checks passed.")