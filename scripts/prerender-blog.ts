// scripts/prerender-blog.ts
// Runs AFTER `vite build`. Writes dist/blog/<slug>/index.html for each published
// post with its own OG/Twitter/canonical/title tags AND a server-rendered
// <article> body baked into the static HTML. Crawlers and importers that don't
// run JS (Facebook, LinkedIn, X, Medium's story importer, Pinterest, etc.) can
// then read the full post immediately. The React app still hydrates on top for
// real users, so nothing about the live experience changes.

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
  content: string | null;
  cover_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  updated_at: string | null;
  author_id: string | null;
};

type Author = { id: string; name: string | null };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const absolutize = (u: string | null | undefined) => {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `${BASE_URL}${s.startsWith("/") ? "" : "/"}${s}`;
};

/** Rewrite relative URLs inside the post's HTML content to absolute URLs so
 *  Medium's importer can resolve images/links. */
function absolutizeContent(html: string): string {
  return html
    .replace(/(<img\b[^>]*\bsrc=")(\/[^"]*)(")/gi, (_, a, path, b) => `${a}${BASE_URL}${path}${b}`)
    .replace(/(<a\b[^>]*\bhref=")(\/[^"]*)(")/gi, (_, a, path, b) => `${a}${BASE_URL}${path}${b}`);
}

async function fetchPosts(): Promise<Post[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/posts?select=slug,title,excerpt,content,cover_image_url,meta_title,meta_description,published_at,updated_at,author_id&status=eq.published&order=published_at.desc`,
    { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } },
  );
  if (!res.ok) {
    console.warn("prerender-blog: failed to fetch posts", res.status);
    return [];
  }
  return res.json();
}

async function fetchAuthors(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!ids.length) return map;
  const qs = `id=in.(${ids.map(encodeURIComponent).join(",")})`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/authors_public?select=id,name&${qs}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  if (!res.ok) return map;
  const rows: Author[] = await res.json();
  for (const r of rows) if (r.id && r.name) map.set(r.id, r.name);
  return map;
}

function renderArticle(post: Post, authorName: string | null): string {
  const title = post.title;
  const url = `${BASE_URL}/blog/${post.slug}/`;
  const image = absolutize(post.cover_image_url);
  const dateISO = post.published_at || "";
  const dateHuman = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const excerpt = post.excerpt || "";
  const content = post.content ? absolutizeContent(post.content) : "";

  return `
    <article>
      <h1>${esc(title)}</h1>
      ${dateISO ? `<p><time datetime="${esc(dateISO)}">${esc(dateHuman)}</time>${authorName ? ` · By <span rel="author">${esc(authorName)}</span>` : ""}</p>` : ""}
      ${image ? `<p><img src="${esc(image)}" alt="${esc(title)}" /></p>` : ""}
      ${excerpt ? `<p><em>${esc(excerpt)}</em></p>` : ""}
      ${content}
      <p><a href="${esc(url)}">Read the original post on Blank2Branded</a></p>
    </article>`;
}

function renderArticleJsonLd(post: Post, authorName: string | null): string {
  const url = `${BASE_URL}/blog/${post.slug}/`;
  const image = absolutize(post.cover_image_url);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.excerpt || "",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    ...(image ? { image: [image] } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    ...(post.updated_at ? { dateModified: post.updated_at } : {}),
    ...(authorName ? { author: { "@type": "Person", name: authorName } } : {}),
    publisher: {
      "@type": "Organization",
      name: "Blank2Branded",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/og-default.jpg` },
    },
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function renderBlogIndex(posts: Post[]): string {
  const postsHtml = posts
    .map((post) => {
      const url = `${BASE_URL}/blog/${post.slug}/`;
      const image = absolutize(post.cover_image_url);
      const desc = post.meta_description || post.excerpt || `Read ${post.title} on the Blank2Branded blog.`;
      const dateISO = post.published_at || "";
      const dateHuman = post.published_at
        ? new Date(post.published_at).toLocaleDateString("en-ZA", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "";

      return `
        <article>
          ${image ? `<a href="${esc(url)}"><img src="${esc(image)}" alt="${esc(post.title)}" loading="lazy" /></a>` : ""}
          <h2><a href="${esc(url)}">${esc(post.title)}</a></h2>
          ${dateISO ? `<p><time datetime="${esc(dateISO)}">${esc(dateHuman)}</time></p>` : ""}
          <p>${esc(desc)}</p>
          <p><a href="${esc(url)}">Read more</a></p>
        </article>`;
    })
    .join("\n");

  return `
    <main>
      <section>
        <h1>Blank2Branded Blog</h1>
        <p>DTF printing tips, blank apparel guides, and custom apparel branding advice for South African businesses, resellers and print shops.</p>
      </section>
      <section aria-label="Latest blog posts">
        ${postsHtml || "<p>No posts published yet.</p>"}
      </section>
    </main>`;
}

function renderBlogIndexJsonLd(posts: Post[]): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blank2Branded Blog",
    description:
      "DTF printing tips, blank apparel guides, and custom apparel branding advice for South African businesses.",
    url: `${BASE_URL}/blog/`,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${BASE_URL}/blog/${post.slug}/`,
      ...(post.published_at ? { datePublished: post.published_at } : {}),
      ...(post.cover_image_url ? { image: [absolutize(post.cover_image_url)] } : {}),
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function rewriteHead(template: string, post: Post): string {
  const title = post.meta_title || `${post.title} | Blank2Branded Blog`;
  const desc =
    post.meta_description ||
    post.excerpt ||
    `Read ${post.title} on the Blank2Branded blog — DTF prints & blank apparel insights from South Africa.`;
  const url = `${BASE_URL}/blog/${post.slug}/`;
  const image = absolutize(post.cover_image_url) || `${BASE_URL}/og-default.jpg`;

  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);

  html = html.replace(
    /<meta\s+name="description"[^>]*\/?>(\s*)/i,
    `<meta name="description" content="${esc(desc)}" />\n    `,
  );

  html = html.replace(
    /<link\s+rel="canonical"[^>]*\/?>/i,
    `<link rel="canonical" href="${esc(url)}" />`,
  );

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

  html = html
    .replace(/\s*<meta\s+property="og:[^"]+"[^>]*\/?>/gi, "")
    .replace(/\s*<meta\s+name="twitter:[^"]+"[^>]*\/?>/gi, "")
    .replace(/<\/head>/i, `    ${ogBlock}\n  </head>`);

  return html;
}

/** Inject the prerendered article into the SSR root so no-JS crawlers/importers
 *  (Medium, Facebook debugger, etc.) see the real content. React hydrates on
 *  top for real users and replaces this placeholder. */
function injectArticle(html: string, articleHtml: string): string {
  // Try common React root ids first, else fall back to injecting before </body>.
  const rootPattern = /<div\s+id="(root|app)"[^>]*>\s*<\/div>/i;
  if (rootPattern.test(html)) {
    return html.replace(rootPattern, (m) =>
      m.replace(/>\s*<\/div>/i, `>${articleHtml}</div>`),
    );
  }
  return html.replace(/<\/body>/i, `${articleHtml}\n  </body>`);
}

function rewriteBlogIndexHead(template: string): string {
  const title = "Blog | DTF Printing & Blank Apparel Tips South Africa | Blank2Branded";
  const desc =
    "Guides, tips and news on DTF printing, blank apparel and custom t-shirt printing in South Africa. From the Blank2Branded team in Mbombela.";
  const url = `${BASE_URL}/blog/`;
  const image = `${BASE_URL}/og-default.jpg`;

  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"[^>]*\/?>(\s*)/i,
    `<meta name="description" content="${esc(desc)}" />\n    `,
  );
  html = html.replace(
    /<link\s+rel="canonical"[^>]*\/?>/i,
    `<link rel="canonical" href="${esc(url)}" />`,
  );

  const ogBlock = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:secure_url" content="${esc(image)}" />`,
    `<meta property="og:site_name" content="Blank2Branded" />`,
    `<meta property="og:locale" content="en_ZA" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ].join("\n    ");

  return html
    .replace(/\s*<meta\s+property="og:[^"]+"[^>]*\/?>/gi, "")
    .replace(/\s*<meta\s+name="twitter:[^"]+"[^>]*\/?>/gi, "")
    .replace(/<\/head>/i, `    ${ogBlock}\n  </head>`);
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
  const authorIds = Array.from(
    new Set(posts.map((p) => p.author_id).filter((v): v is string => !!v)),
  );
  const authors = await fetchAuthors(authorIds);

  const blogIndexPath = resolve(distDir, "blog", "index.html");
  const blogIndexTemplate = existsSync(blogIndexPath)
    ? readFileSync(blogIndexPath, "utf8")
    : template;
  let blogIndexHtml = rewriteBlogIndexHead(blogIndexTemplate);
  blogIndexHtml = blogIndexHtml.replace(
    /<\/head>/i,
    `    ${renderBlogIndexJsonLd(posts)}\n  </head>`,
  );
  blogIndexHtml = injectArticle(blogIndexHtml, renderBlogIndex(posts));
  mkdirSync(dirname(blogIndexPath), { recursive: true });
  writeFileSync(blogIndexPath, blogIndexHtml);

  let written = 0;
  for (const post of posts) {
    if (!post.slug) continue;
    const authorName = post.author_id ? authors.get(post.author_id) || null : null;
    let html = rewriteHead(template, post);
    // Inject Article JSON-LD into <head> so Medium's importer sees it up front.
    const jsonLd = renderArticleJsonLd(post, authorName);
    html = html.replace(/<\/head>/i, `    ${jsonLd}\n  </head>`);
    html = injectArticle(html, renderArticle(post, authorName));
    const out = resolve(distDir, "blog", post.slug, "index.html");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    written++;
  }
  console.log(
    `prerender-blog: wrote ${written} prerendered blog pages plus the blog index (with crawler-visible bodies)`,
  );
}

main().catch((e) => {
  console.error("prerender-blog failed:", e);
});
