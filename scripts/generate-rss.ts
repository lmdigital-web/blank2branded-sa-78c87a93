// scripts/generate-rss.ts
// Generates public/rss.xml (RSS 2.0) from published blog posts, so tools like
// Metricool Autolists can auto-post every new article to Facebook/Pinterest.
// Runs together with generate-sitemap.ts via the package.json prebuild hook.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { loadEnv } from "vite";

const env = loadEnv("production", process.cwd(), "");
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !ANON) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
}

const BASE_URL = "https://blank2branded.co.za";
const FEED_PATH = "/rss.xml";
const MAX_ITEMS = 30; // Metricool autolists cap at 200; a rolling 30 is plenty.

interface FeedPost {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const absolutize = (u: string | null | undefined) => {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `${BASE_URL}${s.startsWith("/") ? "" : "/"}${s}`;
};

const imageMime = (u: string): string => {
  const ext = u.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "avif") return "image/avif";
  return "image/jpeg";
};

async function fetchPosts(): Promise<FeedPost[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?select=slug,title,excerpt,cover_image_url,published_at&status=eq.published&order=published_at.desc&limit=${MAX_ITEMS}`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } },
    );
    if (!res.ok) {
      console.warn("Failed to fetch blog posts for RSS:", res.status);
      return [];
    }
    return (await res.json()) as FeedPost[];
  } catch (err) {
    console.warn("Error fetching blog posts for RSS:", err);
    return [];
  }
}

function rfc822(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toUTCString();
  } catch {
    return "";
  }
}

function generateRss(posts: FeedPost[]): string {
  const lastBuild = posts[0]?.published_at ? rfc822(posts[0].published_at) : new Date().toUTCString();

  const items = posts.map((p) => {
    const url = `${BASE_URL}/blog/${p.slug}/`;
    const image = absolutize(p.cover_image_url);
    const description =
      p.excerpt ||
      `Read ${p.title} on the Blank2Branded blog — DTF printing and blank apparel insights from South Africa.`;

    return [
      "    <item>",
      `      <title>${esc(p.title)}</title>`,
      `      <link>${url}</link>`,
      // GUID must be a stable, globally unique identifier for the article.
      `      <guid isPermaLink="true">${url}</guid>`,
      rfc822(p.published_at) ? `      <pubDate>${rfc822(p.published_at)}</pubDate>` : null,
      `      <description>${esc(description)}</description>`,
      image
        ? `      <enclosure url="${image}" type="${imageMime(image)}" length="0" />`
        : null,
      "    </item>",
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
    `  <channel>`,
    `    <title>Blank2Branded Blog</title>`,
    `    <link>${BASE_URL}/blog/</link>`,
    `    <description>DTF printing tips, blank apparel guides, and custom apparel branding advice for South African businesses, resellers and print shops.</description>`,
    `    <language>en-za</language>`,
    `    <lastBuildDate>${lastBuild}</lastBuildDate>`,
    `    <atom:link href="${BASE_URL}${FEED_PATH}" rel="self" type="application/rss+xml" />`,
    `    <generator>Blank2Branded</generator>`,
    ...items,
    `  </channel>`,
    `</rss>`,
  ].join("\n");
}

async function main() {
  console.log("Generating RSS feed from published blog posts...");
  const posts = await fetchPosts();
  const rss = generateRss(posts);
  writeFileSync(resolve("public/rss.xml"), rss);
  console.log(`rss.xml written with ${posts.length} items`);
}

main();
