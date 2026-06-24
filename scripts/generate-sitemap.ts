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

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/blanks", changefreq: "weekly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/dtf", changefreq: "weekly", priority: "0.9" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
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
      path: `/blog/${r.slug}`,
      lastmod: r.updated_at?.split("T")[0],
      changefreq: "monthly" as const,
      priority: "0.7",
    }));
  } catch (err) {
    console.warn("Error fetching blog posts for sitemap:", err);
    return [];
  }
}

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          handle
          updatedAt
        }
      }
    }
  }
`;

async function fetchShopifyProducts(): Promise<SitemapEntry[]> {
  const SHOPIFY_STOREFRONT_URL = "https://ufg0w7-mr.myshopify.com/api/2025-07/graphql.json";
  const SHOPIFY_STOREFRONT_TOKEN = "a10d448868c45c91fccf6cf354ec66e7";

  try {
    const response = await fetch(SHOPIFY_STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: PRODUCTS_QUERY, variables: { first: 250 } }),
    });

    if (!response.ok) {
      console.warn("Failed to fetch Shopify products for sitemap:", response.status);
      return [];
    }

    const data = await response.json();
    const edges = data?.data?.products?.edges ?? [];

    return edges.map((edge: { node: { handle: string; updatedAt?: string } }) => ({
      path: `/products/${edge.node.handle}`,
      lastmod: edge.node.updatedAt ? edge.node.updatedAt.split("T")[0] : undefined,
      changefreq: "weekly" as const,
      priority: "0.8",
    }));
  } catch (err) {
    console.warn("Error fetching Shopify products for sitemap:", err);
    return [];
  }
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
  console.log("Fetching Shopify products and blog posts for sitemap...");
  const [productEntries, postEntries] = await Promise.all([
    fetchShopifyProducts(),
    fetchBlogPosts(),
  ]);
  const allEntries = [...staticEntries, ...productEntries, ...postEntries];

  const sitemap = generateSitemap(allEntries);
  writeFileSync(resolve("public/sitemap.xml"), sitemap);
  console.log(
    `sitemap.xml written with ${allEntries.length} entries (${productEntries.length} products, ${postEntries.length} blog posts)`,
  );
}

main();
