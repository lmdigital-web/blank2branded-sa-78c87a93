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
];

// ---- Shopify products --------------------------------------------------------

type ShopifyProduct = {
  handle: string;
  title: string;
  description: string;
  updatedAt?: string;
  seo?: { title?: string | null; description?: string | null };
  featuredImage?: { url: string; altText?: string | null } | null;
  priceRange?: {
    minVariantPrice?: { amount: string; currencyCode: string };
  };
  vendor?: string;
};

const SHOPIFY_STOREFRONT_URL =
  "https://ufg0w7-mr.myshopify.com/api/2025-07/graphql.json";
const SHOPIFY_STOREFRONT_TOKEN = "a10d448868c45c91fccf6cf354ec66e7";

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          handle
          title
          description
          updatedAt
          vendor
          seo { title description }
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
  }
`;

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  try {
    const res = await fetch(SHOPIFY_STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: PRODUCTS_QUERY, variables: { first: 250 } }),
    });
    if (!res.ok) {
      console.warn("prerender-routes: Shopify fetch failed", res.status);
      return [];
    }
    const data = await res.json();
    const edges = data?.data?.products?.edges ?? [];
    return edges.map((e: { node: ShopifyProduct }) => e.node);
  } catch (err) {
    console.warn("prerender-routes: Shopify fetch error", err);
    return [];
  }
}

function productRoute(p: ShopifyProduct): RouteMeta {
  const path = `/products/${p.handle}`;
  const url = `${BASE_URL}${path}`;
  const baseTitle = p.seo?.title || p.title;
  const title = `${baseTitle} | Blank2Branded South Africa`;
  const description = (
    p.seo?.description ||
    (p.description || "").replace(/\s+/g, " ").trim()
  ).slice(0, 300);
  const image = p.featuredImage?.url || "";
  const price = p.priceRange?.minVariantPrice;
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description,
    url,
    ...(image ? { image: [image] } : {}),
    brand: { "@type": "Brand", name: p.vendor || "Blank2Branded" },
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: price.currencyCode,
            price: price.amount,
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
      `Buy ${p.title} from Blank2Branded — DTF prints and blank apparel with nationwide shipping across South Africa.`,
    keywords: `${p.title}, ${p.title} South Africa, buy ${p.title} online, Blank2Branded`,
    image,
    ogType: "product",
    jsonLd,
  };
}

// ---- Template rewrite --------------------------------------------------------

function rewriteHead(template: string, r: RouteMeta): string {
  const url = `${BASE_URL}${r.path}`;
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
  writeFileSync(templatePath, rewriteHead(template, rootRoute));

  let written = 1;

  for (const base of staticRoutes) {
    const r = applyOverride(base, overrides[base.path]);
    const html = rewriteHead(template, r);
    const out = resolve(distDir, r.path.replace(/^\//, ""), "index.html");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    written++;
  }

  const products = await fetchShopifyProducts();
  for (const p of products) {
    if (!p.handle) continue;
    const r = productRoute(p);
    const html = rewriteHead(template, r);
    const out = resolve(distDir, "products", p.handle, "index.html");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    written++;
  }

  console.log(
    `prerender-routes: wrote ${written} prerendered pages (${staticRoutes.length} static + ${products.length} products + root); ${Object.keys(overrides).length} route_meta overrides applied`,
  );
}

main().catch((e) => {
  console.error("prerender-routes failed:", e);
});
