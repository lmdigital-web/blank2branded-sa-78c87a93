// scripts/prerender-blog.ts
// Runs AFTER `vite build`. Writes dist/blog/<slug>/index.html for each published
// post with its own OG/Twitter/canonical/title tags baked into the static HTML so
// Facebook/LinkedIn/X (which don't run JS) read the correct preview instantly.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";

const BASE_URL = "https://blank2branded.co.za";
const SUPABASE_URL = "https://enpdahmqwhdukbnykqyy.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucGRhaG1xd2hkdWtibnlrcXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTE3MzgsImV4cCI6MjA5NTI4NzczOH0.hJlNSoKU1-wS_sL2JF_AKXaLkw2Zvp8a_YzzAt0kVak";

type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  updated_at: string | null;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const absolutize = (u: string | null | undefined) => {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `${BASE_URL}${s.startsWith("/") ? "" : "/"}${s}`;
};

async function fetchPosts(): Promise<Post[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/posts?select=slug,title,excerpt,cover_image_url,meta_title,meta_description,published_at,updated_at&status=eq.published&order=published_at.desc`,
    { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } },
  );
  if (!res.ok) {
    console.warn("prerender-blog: failed to fetch posts", res.status);
    return [];
  }
  return res.json();
}

function rewriteHead(template: string, post: Post): string {
  const title = post.meta_title || `${post.title} | Blank2Branded Blog`;
  const desc =
    post.meta_description ||
    post.excerpt ||
    `Read ${post.title} on the Blank2Branded blog — DTF prints & blank apparel insights from South Africa.`;
  const url = `${BASE_URL}/blog/${post.slug}`;
  const image = absolutize(post.cover_image_url) || `${BASE_URL}/og-default.jpg`;

  let html = template;

  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);

  // meta name=description
  html = html.replace(
    /<meta\s+name="description"[^>]*\/?>(\s*)/i,
    `<meta name="description" content="${esc(desc)}" />\n    `,
  );

  // canonical
  html = html.replace(
    /<link\s+rel="canonical"[^>]*\/?>/i,
    `<link rel="canonical" href="${esc(url)}" />`,
  );

  // OG tags — replace existing and ensure article-specific ones present
  const ogBlock = [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:secure_url" content="${esc(image)}" />`,
    `<meta property="og:site_name" content="Blank2Branded" />`,
    `<meta property="og:locale" content="en_ZA" />`,
    post.published_at
      ? `<meta property="article:published_time" content="${esc(post.published_at)}" />`
      : "",
    post.updated_at
      ? `<meta property="article:modified_time" content="${esc(post.updated_at)}" />`
      : "",
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ]
    .filter(Boolean)
    .join("\n    ");

  // Drop any existing og:* / twitter:* meta tags, then inject our block before </head>
  html = html
    .replace(/\s*<meta\s+property="og:[^"]+"[^>]*\/?>/gi, "")
    .replace(/\s*<meta\s+name="twitter:[^"]+"[^>]*\/?>/gi, "")
    .replace(/<\/head>/i, `    ${ogBlock}\n  </head>`);

  return html;
}

async function main() {
  const distDir = resolve("dist");
  const templatePath = resolve(distDir, "index.html");
  if (!existsSync(templatePath)) {
    console.warn("prerender-blog: dist/index.html not found — skipping (run after vite build)");
    return;
  }
  const template = readFileSync(templatePath, "utf8");
  const posts = await fetchPosts();
  let written = 0;
  for (const post of posts) {
    if (!post.slug) continue;
    const html = rewriteHead(template, post);
    const out = resolve(distDir, "blog", post.slug, "index.html");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    written++;
  }
  console.log(`prerender-blog: wrote ${written} prerendered blog pages`);
}

main().catch((e) => {
  console.error("prerender-blog failed:", e);
  // Do not break the build — SPA still works without prerender.
});
