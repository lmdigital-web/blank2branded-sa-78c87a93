// scripts/prerender-routes.ts
// Runs AFTER `vite build`. Writes dist/<route>/index.html for every static
// public route AND dist/products/<handle>/index.html for every Shopify product,
// each with route-correct <title>, <meta description>, <link canonical>, and
// og:* tags baked into the static HTML. This is what lets Google index each
// page as a distinct URL — without this, every route ships the same index.html
// with canonical pointing at the homepage and Google collapses them all into
// one indexed page.
//
// Blog posts are handled separately by scripts/prerender-blog.ts.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";

const BASE_URL = "https://blank2branded.co.za";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const absolutize = (u: string | null | undefined) => {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `${BASE_URL}${s.startsWith("/") ? "" : "/"}${s}`;
};

const canonicalUrlForPath = (path: string) => {
  const finalPath = path === "/" || path.endsWith("/") ? path : `${path}/`;
  return `${BASE_URL}${finalPath}`;
};

type RouteMeta = {
  path: string; // "/shop", "/products/foo"
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  ogType?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

// ---- Static routes -----------------------------------------------------------
// Keep this in sync with the pageMeta map in src/App.tsx. These are the routes
// that show up in the sitemap and need real crawler-visible SEO.

const staticRoutes: RouteMeta[] = [
  {
    path: "/about",
    title: "About Blank2Branded | DTF & Blank Apparel Supplier in South Africa",
    description:
      "Blank2Branded is a Mbombela-based DTF print and blank apparel supplier serving resellers, brands and print shops across South Africa. Fast turnaround, courier nationwide.",
    keywords:
      "DTF supplier South Africa, blank apparel supplier South Africa, wholesale t-shirt supplier, Mbombela print shop, Mpumalanga DTF supplier, about Blank2Branded",
  },
  {
    path: "/blanks",
    title: "Blank T-Shirts South Africa | Wholesale Tees, Golf Shirts & Hoodies",
    description:
      "Wholesale blank t-shirts, golf shirts and hoodies in South Africa. 100% cotton and poly-cotton blanks ready for DTF, screen print or embroidery. Courier nationwide.",
    keywords:
      "blank t-shirts South Africa, wholesale blank t-shirts, blank golf shirts South Africa, blank hoodies South Africa, plain t-shirts wholesale, 100 cotton blanks, blanks for DTF printing, blanks for embroidery, screen printing blanks South Africa, bulk t-shirts South Africa",
  },
  {
    path: "/contact",
    title: "Contact Blank2Branded | DTF & Blank Apparel Quotes South Africa",
    description:
      "Get a DTF print or blank apparel quote from Blank2Branded. WhatsApp, email or call our Mbombela team. Fast quotes and nationwide courier across South Africa.",
    keywords:
      "DTF printing quote South Africa, blank t-shirt quote, contact DTF supplier, WhatsApp DTF printing, Mbombela DTF contact, custom t-shirt printing quote",
  },
  {
    path: "/dtf",
    title: "DTF Transfers South Africa | A6 to 10m Gang Sheets | Blank2Branded",
    description:
      "Order full-colour DTF transfers in South Africa — A6, A5, A4, A3 and 10m gang sheets. Vivid prints on cotton, polyester and blends. Courier nationwide from Mbombela.",
    keywords:
      "DTF transfers South Africa, DTF prints South Africa, gang sheet DTF South Africa, A3 DTF print, A4 DTF print, A5 DTF transfers, 10m DTF roll, custom DTF transfers, DTF heat transfers, DTF printing for resellers",
  },
  {
    path: "/shop",
    title: "Shop DTF Transfers & Blank T-Shirts Online | Blank2Branded South Africa",
    description:
      "Shop DTF transfers, blank t-shirts, golf shirts and hoodies online. Wholesale pricing, secure checkout and nationwide courier across South Africa.",
    keywords:
      "buy DTF prints online South Africa, buy blank t-shirts online South Africa, online DTF shop, wholesale blanks online, order DTF transfers South Africa, blank apparel online store",
  },
  {
    path: "/blog",
    title: "Blog | DTF Printing & Blank Apparel Tips South Africa | Blank2Branded",
    description:
      "Guides, tips and news on DTF printing, blank apparel and custom t-shirt printing in South Africa. From the Blank2Branded team in Mbombela.",
    keywords:
      "DTF printing blog, DTF tips South Africa, blank apparel guides, custom t-shirt printing tips, Blank2Branded blog",
  },
  {
    path: "/display",
    title: "Branded Display & Signage South Africa | Gazebos, Banners, Flags | Blank2Branded",
    description:
      "Branded gazebos, banner walls, pull-up banners, flags, table cloths and more. Custom display solutions for events and expos across South Africa. Request a quote.",
    keywords:
      "branded gazebos South Africa, pull up banners South Africa, harp banners, banner walls, branded table cloths, fence wrap, corporate flags, A-frame banners, pop up banners, branded umbrellas, pennant flags, display products South Africa",
  },
  {
    path: "/sublimation",
    title:
      "Sublimation Printing South Africa | Custom Golf Shirts, Jerseys, Tees | Blank2Branded",
    description:
      "All-over sublimation printed apparel for Mens, Ladies and Kids — custom golf shirts, rugby jerseys, t-shirts, vests, skirts and sets. Edge-to-edge full-colour print. Request a quote.",
    keywords:
      "sublimation printing South Africa, custom golf shirts, custom rugby jerseys, sublimated t-shirts, all over print apparel, custom team kits South Africa, sublimation Mbombela, kids sports kits, ladies golf shirts custom",
  },
  {
    path: "/catalogues",
    title:
      "Catalogues | Branded Gifts, Bags & Corporate Gifting South Africa | Blank2Branded",
    description:
      "Browse our digital catalogues for branded gifts, bags, drinkware and corporate gifting in South Africa. Request a quote with print and embroidery options.",
    keywords:
      "branded gifts catalogue South Africa, corporate gifts catalogue, branded bags catalogue, conference bags South Africa, promotional products catalogue, Blank2Branded catalogues",
  },
  {
    path: "/privacy",
    title: "Privacy Policy | Blank2Branded South Africa",
    description:
      "How Blank2Branded collects, uses and protects your personal information under POPIA. South African DTF and blank apparel supplier based in Mbombela.",
    keywords: "privacy policy, POPIA, Blank2Branded privacy, data protection South Africa",
  },
  {
    path: "/terms",
    title: "Terms & Conditions | Blank2Branded South Africa",
    description:
      "Terms and conditions for buying DTF transfers and blank apparel from Blank2Branded — orders, delivery, returns and refunds for South African customers.",
    keywords: "terms and conditions, returns policy, refund policy, Blank2Branded terms",
  },
  {
    path: "/sports-kits",
    title: "Sublimated Sports Kits South Africa | Custom Team Kits | Blank2Branded",
    description:
      "Custom sublimated sports kits for rugby, soccer, netball, hockey, cricket, basketball, cycling and athletics in South Africa. Team colours, numbers and sponsors baked into the fabric. Nationwide courier from Mbombela.",
    keywords:
      "sublimated sports kits, sublimated sports kits South Africa, custom sports kits, sublimated jerseys, sublimated rugby jerseys, sublimated soccer kits, sublimated netball dresses, custom team kits South Africa, custom sports uniforms, school sports kits South Africa",
  },
];

// ---- Catalogue products (Supabase) -------------------------------------------

type CatalogueProduct = {
  id: string;
  handle: string;
  title: string;
  description: string | null;
  updated_at?: string;
  meta_title?: string | null;
  meta_description?: string | null;
  base_price?: number | null;
  currency_code?: string | null;
  brand?: string | null;
  image?: { url: string; alt: string | null } | null;
};

const SUPABASE_REST = "https://enpdahmqwhdukbnykqyy.supabase.co/rest/v1";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucGRhaG1xd2hkdWtibnlrcXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTE3MzgsImV4cCI6MjA5NTI4NzczOH0.hJlNSoKU1-wS_sL2JF_AKXaLkw2Zvp8a_YzzAt0kVak";
const SUPABASE_HEADERS = {
  apikey: SUPABASE_ANON,
  Authorization: `Bearer ${SUPABASE_ANON}`,
};

async function fetchCatalogueProducts(): Promise<CatalogueProduct[]> {
  const products: CatalogueProduct[] = [];
  try {
    for (let offset = 0; ; offset += 1000) {
      const res = await fetch(
        `${SUPABASE_REST}/shop_products?select=id,handle,title,description,updated_at,meta_title,meta_description,base_price,currency_code,brand&status=eq.published&order=handle.asc&limit=1000&offset=${offset}`,
        { headers: SUPABASE_HEADERS },
      );
      if (!res.ok) {
        console.warn("prerender-routes: product fetch failed", res.status);
        break;
      }
      const rows = (await res.json()) as CatalogueProduct[];
      products.push(...rows.filter((r) => r.handle));
      if (rows.length < 1000) break;
    }
  } catch (err) {
    console.warn("prerender-routes: product fetch error", err);
    return products;
  }

  // Attach the primary image per product (batched by id).
  try {
    for (let i = 0; i < products.length; i += 100) {
      const batch = products.slice(i, i + 100);
      const ids = batch.map((p) => p.id).join(",");
      const res = await fetch(
        `${SUPABASE_REST}/shop_product_images?select=product_id,url,alt,position&product_id=in.(${ids})&order=position.asc`,
        { headers: SUPABASE_HEADERS },
      );
      if (!res.ok) continue;
      const rows = (await res.json()) as {
        product_id: string;
        url: string;
        alt: string | null;
      }[];
      const byProduct = new Map<string, { url: string; alt: string | null }>();
      for (const r of rows) if (!byProduct.has(r.product_id)) byProduct.set(r.product_id, r);
      for (const p of batch) p.image = byProduct.get(p.id) ?? null;
    }
  } catch (err) {
    console.warn("prerender-routes: product image fetch error", err);
  }

  return products;
}

function productRoute(p: CatalogueProduct): RouteMeta {
  const path = `/products/${p.handle}`;
  const url = canonicalUrlForPath(path);
  const baseTitle = p.meta_title || p.title;
  const title = `${baseTitle} | Blank2Branded South Africa`;
  const description = (
    p.meta_description ||
    (p.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  ).slice(0, 300);
  const image = p.image?.url || "";
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description,
    url,
    ...(image ? { image: [image] } : {}),
    brand: { "@type": "Brand", name: p.brand || "Blank2Branded" },
    ...(p.base_price
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: p.currency_code || "ZAR",
            price: String(p.base_price),
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
  return {
    path,
    title,
    description:
      description ||
      `Buy ${p.title} from Blank2Branded — branded apparel and corporate gifts with nationwide delivery across South Africa.`,
    keywords: `${p.title}, ${p.title} South Africa, buy ${p.title} online, Blank2Branded`,
    image,
    ogType: "product",
    jsonLd,
  };
}


// ---- Template rewrite --------------------------------------------------------

function rewriteHead(template: string, r: RouteMeta): string {
  const url = canonicalUrlForPath(r.path);
  const image = absolutize(r.image) || `${BASE_URL}/og-default.jpg`;
  const ogType = r.ogType || "website";

  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(r.title)}</title>`);

  html = html.replace(
    /<meta\s+name="description"[^>]*\/?>/i,
    `<meta name="description" content="${esc(r.description)}" />`,
  );

  if (r.keywords) {
    if (/<meta\s+name="keywords"/i.test(html)) {
      html = html.replace(
        /<meta\s+name="keywords"[^>]*\/?>/i,
        `<meta name="keywords" content="${esc(r.keywords)}" />`,
      );
    } else {
      html = html.replace(
        /<\/head>/i,
        `    <meta name="keywords" content="${esc(r.keywords)}" />\n  </head>`,
      );
    }
  }

  html = html.replace(
    /<link\s+rel="canonical"[^>]*\/?>/i,
    `<link rel="canonical" href="${esc(url)}" />`,
  );

  const ogBlock = [
    `<meta property="og:type" content="${esc(ogType)}" />`,
    `<meta property="og:title" content="${esc(r.title)}" />`,
    `<meta property="og:description" content="${esc(r.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:secure_url" content="${esc(image)}" />`,
    `<meta property="og:site_name" content="Blank2Branded" />`,
    `<meta property="og:locale" content="en_ZA" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(r.title)}" />`,
    `<meta name="twitter:description" content="${esc(r.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ].join("\n    ");

  html = html
    .replace(/\s*<meta\s+property="og:[^"]+"[^>]*\/?>/gi, "")
    .replace(/\s*<meta\s+name="twitter:[^"]+"[^>]*\/?>/gi, "")
    .replace(/<\/head>/i, `    ${ogBlock}\n  </head>`);

  if (r.jsonLd) {
    const arr = Array.isArray(r.jsonLd) ? r.jsonLd : [r.jsonLd];
    const scripts = arr
      .map(
        (obj) =>
          `<script type="application/ld+json">${JSON.stringify(obj)}</script>`,
      )
      .join("\n    ");
    html = html.replace(/<\/head>/i, `    ${scripts}\n  </head>`);
  }

  return html;
}

// ---- Body injection (crawler-visible SSR content) ----------------------------

/** Inject prerendered <main> content into the React root so no-JS crawlers see
 *  real body text. React hydrates over this for real users. */
function injectBody(html: string, bodyHtml: string): string {
  const rootWithChildren = /(<div\s+id="(?:root|app)"[^>]*>)[\s\S]*?(<\/div>)(?=\s*(?:<script|<\/body>))/i;
  if (rootWithChildren.test(html)) {
    return html.replace(rootWithChildren, (_m, open, close) => `${open}${bodyHtml}${close}`);
  }
  const emptyRoot = /<div\s+id="(?:root|app)"[^>]*>\s*<\/div>/i;
  if (emptyRoot.test(html)) {
    return html.replace(emptyRoot, (m) => m.replace(/>\s*<\/div>/i, `>${bodyHtml}</div>`));
  }
  return html.replace(/<\/body>/i, `<div id="prerender-fallback" hidden>${bodyHtml}</div>\n  </body>`);
}

const SITE_NAV_LINKS: Array<{ path: string; label: string }> = [
  { path: "/", label: "Home" },
  { path: "/shop", label: "Shop" },
  { path: "/blanks", label: "Blank Apparel" },
  { path: "/dtf", label: "DTF Transfers" },
  { path: "/sublimation", label: "Sublimation" },
  { path: "/display", label: "Display & Signage" },
  { path: "/catalogues", label: "Catalogues" },
  { path: "/blog", label: "Blog" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
];

function renderNav(currentPath: string): string {
  const items = SITE_NAV_LINKS.filter((l) => l.path !== currentPath)
    .map((l) => `<a href="${esc(l.path)}/">${esc(l.label)}</a>`)
    .join(" · ");
  return `<nav aria-label="Site">${items}</nav>`;
}

function renderStaticBody(r: RouteMeta): string {
  const h1 = r.title.split("|")[0].trim();
  return `
    <main>
      <article>
        <h1>${esc(h1)}</h1>
        <p>${esc(r.description)}</p>
        ${r.keywords ? `<p><strong>Topics:</strong> ${esc(r.keywords)}</p>` : ""}
        <p>
          Blank2Branded is a South African supplier of DTF transfers, blank apparel,
          sublimation, display &amp; signage and branded corporate gifting. Based in
          Mbombela with nationwide courier to Johannesburg, Pretoria, Cape Town,
          Durban and the rest of South Africa.
        </p>
        <p>
          <a href="/contact/">Contact us</a> for a quote, or browse the
          <a href="/shop/">online shop</a>.
        </p>
      </article>
      ${renderNav(r.path)}
    </main>`;
}

function renderProductBody(p: CatalogueProduct, r: RouteMeta): string {
  const image = p.image?.url || "";
  const alt = p.image?.alt || p.title;
  const priceStr = p.base_price ? `${p.currency_code || "ZAR"} ${Number(p.base_price).toFixed(2)}` : "";
  const desc = ((p.description || r.description || "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  return `
    <main>
      <article>
        <h1>${esc(p.title)}</h1>
        ${image ? `<p><img src="${esc(image)}" alt="${esc(alt)}" /></p>` : ""}
        ${priceStr ? `<p><strong>From ${esc(priceStr)}</strong></p>` : ""}
        <p>${esc(desc.slice(0, 800))}</p>
        <p>
          Order online with nationwide courier across South Africa, or
          <a href="/contact/">contact Blank2Branded</a> for wholesale pricing.
        </p>
        <p><a href="/shop/">← Back to the shop</a></p>
      </article>
      ${renderNav("/shop")}
    </main>`;
}

// ---- Route meta overrides (from route_meta table in Supabase) ---------------

type OverrideRow = {
  slug: string;
  title: string | null;
  description: string | null;
  canonical: string | null;
  og_image: string | null;
};

async function fetchRouteOverrides(): Promise<Record<string, OverrideRow>> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("prerender-routes: Supabase env not set; skipping route_meta overrides");
    return {};
  }
  try {
    const res = await fetch(`${url}/rest/v1/route_meta?select=slug,title,description,canonical,og_image`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      console.warn("prerender-routes: route_meta fetch failed", res.status);
      return {};
    }
    const rows = (await res.json()) as OverrideRow[];
    const map: Record<string, OverrideRow> = {};
    for (const r of rows) map[r.slug] = r;
    return map;
  } catch (err) {
    console.warn("prerender-routes: route_meta fetch error", err);
    return {};
  }
}

function applyOverride(r: RouteMeta, o?: OverrideRow): RouteMeta {
  if (!o) return r;
  return {
    ...r,
    title: o.title || r.title,
    description: o.description || r.description,
    image: o.og_image || r.image,
  };
}

// ---- BOFU pages -------------------------------------------------------------

type BofuPage = {
  slug: string;
  template: "versus" | "alternatives" | "best" | "local";
  title: string;
  meta_description: string | null;
  h1: string | null;
  intro: string | null;
  body_html: string | null;
  video_embed_html: string | null;
  video_url: string | null;
  faq_json: { q: string; a: string }[] | null;
  city: string | null;
};

async function fetchBofuPages(): Promise<BofuPage[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/bofu_pages?select=slug,template,title,meta_description,h1,intro,body_html,video_embed_html,video_url,faq_json,city&status=eq.published`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) { console.warn("prerender-routes: bofu fetch failed", res.status); return []; }
    return (await res.json()) as BofuPage[];
  } catch (err) { console.warn("prerender-routes: bofu fetch error", err); return []; }
}

function renderBofuBody(b: BofuPage): string {
  const faq = Array.isArray(b.faq_json) ? b.faq_json : [];
  return `
    <main>
      <article>
        <h1>${esc(b.h1 || b.title)}</h1>
        ${b.intro ? `<p>${esc(b.intro)}</p>` : ""}
        ${b.video_embed_html || ""}
        ${b.body_html || ""}
        ${faq.length > 0 ? `<section><h2>Frequently asked questions</h2>${faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}</section>` : ""}
        <p><a href="/shop/">Shop now</a> · <a href="/contact/">Get a quote</a></p>
      </article>
    </main>`;
}

function buildBofuJsonLd(b: BofuPage, path: string): Record<string, unknown>[] {
  const url = `${BASE_URL}${path}/`;
  const out: Record<string, unknown>[] = [{
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: b.title,
    description: b.meta_description || "",
    url,
  }];
  const faq = Array.isArray(b.faq_json) ? b.faq_json : [];
  if (faq.length > 0) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  if (b.video_url) {
    out.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: b.title,
      description: b.meta_description || b.title,
      contentUrl: b.video_url,
      embedUrl: b.video_url,
      uploadDate: new Date().toISOString(),
    });
  }
  return out;
}

// ---- Main --------------------------------------------------------------------

async function main() {
  const distDir = resolve("dist");
  const templatePath = resolve(distDir, "index.html");
  if (!existsSync(templatePath)) {
    console.warn(
      "prerender-routes: dist/index.html not found — skipping (run after vite build)",
    );
    return;
  }
  const template = readFileSync(templatePath, "utf8");

  const overrides = await fetchRouteOverrides();

  const rootRoute: RouteMeta = applyOverride(
    {
      path: "/",
      title:
        "DTF Printing South Africa | Blank T-Shirts & Transfers | Blank2Branded",
      description:
        "Buy DTF transfers and blank t-shirts in South Africa. Gang sheets from A6 to 10m, blank tees, golf shirts & hoodies. Courier nationwide from Mbombela.",
      keywords:
        "DTF printing South Africa, DTF transfers South Africa, DTF prints near me, blank t-shirts South Africa, blank apparel suppliers South Africa, gang sheet printing, custom t-shirt printing South Africa, DTF Mbombela, DTF Mpumalanga, DTF Johannesburg, DTF Pretoria, DTF Cape Town, DTF Durban",
    },
    overrides["/"],
  );
  writeFileSync(templatePath, injectBody(rewriteHead(template, rootRoute), renderStaticBody(rootRoute)));

  let written = 1;

  for (const base of staticRoutes) {
    const r = applyOverride(base, overrides[base.path]);
    const html = injectBody(rewriteHead(template, r), renderStaticBody(r));
    const out = resolve(distDir, r.path.replace(/^\//, ""), "index.html");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    written++;
  }

  const products = await fetchCatalogueProducts();
  for (const p of products) {
    if (!p.handle) continue;
    const r = productRoute(p);
    const html = injectBody(rewriteHead(template, r), renderProductBody(p, r));
    const out = resolve(distDir, "products", p.handle, "index.html");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    written++;
  }

  // BOFU pages (versus / alternatives / best / local)
  const bofuPages = await fetchBofuPages();
  for (const b of bofuPages) {
    const isNational = (b.city || "").trim().toLowerCase() === "south africa";
    const path = b.template === "local"
      ? isNational
        ? `/${b.slug}`
        : b.city
          ? `/local/${b.city.toLowerCase().replace(/\s+/g, "-")}/${b.slug}`
          : `/local/${b.slug}`
      : `/${b.template === "versus" ? "vs" : b.template}/${b.slug}`;
    const r: RouteMeta = {
      path,
      title: b.title,
      description: b.meta_description || "",
      ogType: "article",
      jsonLd: buildBofuJsonLd(b, path),
    };
    const html = injectBody(rewriteHead(template, r), renderBofuBody(b));
    const out = resolve(distDir, path.replace(/^\//, ""), "index.html");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    written++;
  }

  console.log(
    `prerender-routes: wrote ${written} prerendered pages (${staticRoutes.length} static + ${products.length} products + ${bofuPages.length} BOFU + root); ${Object.keys(overrides).length} route_meta overrides applied`,
  );
}

main().catch((e) => {
  console.error("prerender-routes failed:", e);
});
