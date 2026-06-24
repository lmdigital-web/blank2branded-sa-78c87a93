// scripts/generate-sitemap.ts
// Runs before build to generate public/sitemap.xml with static routes,
// published products (from Supabase) and blog posts (from Supabase).

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://blank2branded.co.za";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/blanks", changefreq: "weekly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/dtf", changefreq: "weekly", priority: "0.9" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
];

async function fetchFromSupabase<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    });
    if (!res.ok) {
      console.warn(`sitemap: failed to fetch ${path} (${res.status})`);
      return [];
    }
    return (await res.json()) as T[];
  } catch (err) {
    console.warn(`sitemap: error fetching ${path}`, err);
    return [];
  }
}

async function fetchBlogPosts(): Promise<SitemapEntry[]> {
  const rows = await fetchFromSupabase<{ slug: string; updated_at: string }>(
    "posts?select=slug,updated_at&status=eq.published&order=published_at.desc",
  );
  return rows.map((r) => ({
    path: `/blog/${r.slug}`,
    lastmod: r.updated_at?.split("T")[0],
    changefreq: "monthly" as const,
    priority: "0.7",
  }));
}

async function fetchShopProducts(): Promise<SitemapEntry[]> {
  const rows = await fetchFromSupabase<{ handle: string; updated_at: string }>(
    "shop_products?select=handle,updated_at&status=eq.published",
  );
  return rows.map((r) => ({
    path: `/products/${r.handle}`,
    lastmod: r.updated_at?.split("T")[0],
    changefreq: "weekly" as const,
    priority: "0.8",
  }));
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean).join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  console.log("Fetching products and blog posts for sitemap…");
  const [productEntries, postEntries] = await Promise.all([
    fetchShopProducts(),
    fetchBlogPosts(),
  ]);
  const allEntries = [...staticEntries, ...productEntries, ...postEntries];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(allEntries));
  console.log(
    `sitemap.xml written: ${allEntries.length} entries ` +
      `(${productEntries.length} products, ${postEntries.length} posts)`,
  );
}

main();
