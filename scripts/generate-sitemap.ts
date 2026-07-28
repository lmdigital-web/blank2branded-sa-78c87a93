// scripts/generate-sitemap.ts
// Runs before build to generate public/sitemap.xml with static routes + Shopify products

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://blank2branded.co.za";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const canonicalPath = (path: string) => (path === "/" || path.endsWith("/") ? path : `${path}/`);

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about/", changefreq: "monthly", priority: "0.7" },
  { path: "/blanks/", changefreq: "weekly", priority: "0.8" },
  { path: "/contact/", changefreq: "monthly", priority: "0.6" },
  { path: "/dtf/", changefreq: "weekly", priority: "0.9" },
  { path: "/shop/", changefreq: "daily", priority: "0.9" },
  { path: "/blog/", changefreq: "weekly", priority: "0.8" },
  { path: "/sublimation/", changefreq: "monthly", priority: "0.8" },
  { path: "/sports-kits/", changefreq: "weekly", priority: "0.9" },
  { path: "/display/", changefreq: "monthly", priority: "0.7" },
  { path: "/catalogues/", changefreq: "monthly", priority: "0.6" },
];

async function fetchBlogPosts(): Promise<SitemapEntry[]> {
  const SUPABASE_URL = "https://enpdahmqwhdukbnykqyy.supabase.co";
  const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucGRhaG1xd2hkdWtibnlrcXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTE3MzgsImV4cCI6MjA5NTI4NzczOH0.hJlNSoKU1-wS_sL2JF_AKXaLkw2Zvp8a_YzzAt0kVak";
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?select=slug,updated_at&status=eq.published&order=published_at.desc`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } },
    );
    if (!res.ok) {
      console.warn("Failed to fetch blog posts for sitemap:", res.status);
      return [];
    }
    const rows: { slug: string; updated_at: string }[] = await res.json();
    return rows.map((r) => ({
      // Trailing slash matches the prerendered path (dist/blog/<slug>/index.html).
      // Without it, hosting 308-redirects to add the slash, which Google reports
      // as a "Redirect error" when the sitemap URL differs from the final URL.
      path: `/blog/${r.slug}/`,
      lastmod: r.updated_at?.split("T")[0],
      changefreq: "monthly" as const,
      priority: "0.7",
    }));
  } catch (err) {
    console.warn("Error fetching blog posts for sitemap:", err);
    return [];
  }
}

async function fetchBofuPages(): Promise<SitemapEntry[]> {
  const SUPABASE_URL = "https://enpdahmqwhdukbnykqyy.supabase.co";
  const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucGRhaG1xd2hkdWtibnlrcXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTE3MzgsImV4cCI6MjA5NTI4NzczOH0.hJlNSoKU1-wS_sL2JF_AKXaLkw2Zvp8a_YzzAt0kVak";
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/bofu_pages?select=slug,template,city,updated_at&status=eq.published`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } },
    );
    if (!res.ok) {
      console.warn("Failed to fetch BOFU pages for sitemap:", res.status);
      return [];
    }
    const rows: { slug: string; template: string; city: string | null; updated_at: string }[] = await res.json();
    const seen = new Set<string>();
    const entries: SitemapEntry[] = [];
    for (const r of rows) {
      const isNational = (r.city || "").trim().toLowerCase() === "south africa";
      const path =
        r.template === "local"
          ? isNational
            ? `/${r.slug}/`
            : r.city
              ? `/local/${r.city.toLowerCase().replace(/\s+/g, "-")}/${r.slug}/`
              : `/local/${r.slug}/`
          : `/${r.template === "versus" ? "vs" : r.template}/${r.slug}/`;
      if (seen.has(path)) continue;
      seen.add(path);
      entries.push({
        path,
        lastmod: r.updated_at?.split("T")[0],
        changefreq: "monthly",
        priority: "0.8",
      });
    }
    return entries;
  } catch (err) {
    console.warn("Error fetching BOFU pages for sitemap:", err);
    return [];
  }
}

async function fetchCatalogueProducts(): Promise<SitemapEntry[]> {
  const SUPABASE_URL = "https://enpdahmqwhdukbnykqyy.supabase.co";
  const ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucGRhaG1xd2hkdWtibnlrcXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTE3MzgsImV4cCI6MjA5NTI4NzczOH0.hJlNSoKU1-wS_sL2JF_AKXaLkw2Zvp8a_YzzAt0kVak";
  const out: SitemapEntry[] = [];
  try {
    // Page through so large catalogues aren't truncated by PostgREST's row cap.
    for (let offset = 0; ; offset += 1000) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/shop_products?select=handle,updated_at&status=eq.published&order=handle.asc&limit=1000&offset=${offset}`,
        { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } },
      );
      if (!res.ok) {
        console.warn("Failed to fetch catalogue products for sitemap:", res.status);
        break;
      }
      const rows: { handle: string; updated_at: string }[] = await res.json();
      for (const r of rows) {
        if (!r.handle) continue;
        out.push({
          path: `/products/${r.handle}/`,
          lastmod: r.updated_at?.split("T")[0],
          changefreq: "weekly",
          priority: "0.8",
        });
      }
      if (rows.length < 1000) break;
    }
    return out;
  } catch (err) {
    console.warn("Error fetching catalogue products for sitemap:", err);
    return out;
  }
}


function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${canonicalPath(e.path)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  console.log("Fetching Shopify products, blog posts, and BOFU pages for sitemap...");
  const [productEntries, postEntries, bofuEntries] = await Promise.all([
    fetchShopifyProducts(),
    fetchBlogPosts(),
    fetchBofuPages(),
  ]);
  const allEntries = [...staticEntries, ...productEntries, ...postEntries, ...bofuEntries];

  const sitemap = generateSitemap(allEntries);
  writeFileSync(resolve("public/sitemap.xml"), sitemap);
  console.log(
    `sitemap.xml written with ${allEntries.length} entries (${productEntries.length} products, ${postEntries.length} blog posts, ${bofuEntries.length} BOFU pages)`,
  );
}

main();
