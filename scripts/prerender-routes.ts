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
import { loadEnv } from "vite";
// Shared with the runtime route + template so the prerendered body and the
// React render can never drift apart.
import {
  DEFAULT_PROCESS_STEPS,
  buildServiceJsonLd,
  resolveBlogHref,
  resolveRelatedHref,
  toServicePage,
  type ServicePage,
  type ServiceBenefit,
  type ServiceProcessStep,
} from "../src/lib/service-pages";


const env = loadEnv("production", process.cwd(), "");
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
}

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
  // Attribute stamped on the emitted <script> tags so the runtime route can
  // clear them and re-inject identical markup instead of duplicating schema.
  jsonLdAttr?: string;
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
    title: "Custom Sublimated Clothing & Sportswear | Blank2Branded",
    description:
      "Custom sublimated clothing and sportswear in South Africa — golfers, tees, hoodies and sport jerseys printed edge-to-edge in dry-fit polyester. Enquire now.",
    keywords:
      "custom sublimated clothing, sublimation printing South Africa, custom golf shirts, sublimated soccer jerseys, sublimated rugby jerseys, sublimated t-shirts, all over print hoodies, dry-fit polyester sublimation, edge-to-edge garment printing, all over print apparel, custom team kits South Africa, sublimation Mbombela, ladies golf shirts custom",
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
    title: "Custom Sports Kits & Teamwear South Africa | Blank2Branded",
    description:
      "Custom sports kits and teamwear for schools, clubs and teams across South Africa — colours, sponsor logos, names and numbers dyed into the fabric. Request a quote.",
    keywords:
      "custom sports kits, sublimated sports kits, sublimated sports kits South Africa, teamwear South Africa, custom team kits, sublimated jerseys, personalised sportswear, custom sports uniforms, school sports kits South Africa, club teamwear South Africa",
  },
  {
    // /returns is linked from the site-wide footer, so without a prerendered page
    // it answered 200 with the homepage canonical — a soft-404.
    path: "/returns",
    title: "Return & Refund Policy | Blank2Branded South Africa",
    description:
      "Blank2Branded return policy: 7 days for defective or damaged goods, with delivery damage reported the same day. Refunds, replacements and return shipping explained.",
    keywords:
      "returns policy South Africa, refund policy, damaged delivery claim, defective goods return, Blank2Branded returns",
  },
  {
    path: "/shop/apparel",
    title: "Shop Blank T-Shirts, Hoodies & Sweaters | DTF Prints | Blank2Branded",
    description:
      "Browse blank t-shirts, hoodies and sweaters plus A4–1m DTF transfers. Wholesale pricing and nationwide courier from Mbombela.",
    keywords:
      "blank t-shirts South Africa, blank hoodies, blank sweaters, DTF prints South Africa, wholesale blanks, buy blanks online",
  },
  {
    path: "/shop/corporate",
    title: "Corporate Gifts, Clothing & Branding Shop | Blank2Branded South Africa",
    description:
      "Shop corporate gifts, workwear, headwear, bags, drinkware, chef wear, display and more — with embroidery, DTF, screen print or heat press branding.",
    keywords:
      "corporate gifts South Africa, branded corporate clothing, corporate workwear, promotional gifts South Africa, branded bags, branded drinkware, corporate branding South Africa",
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

const SUPABASE_REST = `${SUPABASE_URL}/rest/v1`;
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
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: { "@type": "MonetaryAmount", value: "150.00", currency: "ZAR" },
              shippingDestination: { "@type": "DefinedRegion", addressCountry: "ZA" },
              deliveryTime: {
                "@type": "ShippingDeliveryTime",
                handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
                transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 5, unitCode: "DAY" },
              },
            },
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "ZA",
              returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: 7,
              returnMethod: "https://schema.org/ReturnByMail",
              returnFees: "https://schema.org/FreeReturn",
              merchantReturnLink: `${BASE_URL}/returns/`,
            },
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
  const image = absolutize(r.image) || `${BASE_URL}/og-default.png`;
  // Only the generated fallback is a known 1200x630 asset; real product and blog
  // images vary, so declaring dimensions for them would be misleading.
  const usesDefaultImage = image.endsWith("/og-default.png");
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
    `<meta property="og:image:alt" content="${esc(r.title)}" />`,
    ...(usesDefaultImage
      ? [
          `<meta property="og:image:width" content="1200" />`,
          `<meta property="og:image:height" content="630" />`,
        ]
      : []),
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
          `<script type="application/ld+json"${r.jsonLdAttr ? " " + r.jsonLdAttr : ""}>${JSON.stringify(obj)}</script>`,
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
  if (r.path === "/sublimation") return renderSublimationBody(r);
  if (r.path === "/sports-kits") return renderSportsKitsBody(r);
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

// /sublimation/ — crawler-visible body matching the React page sections.
// The React page owns the full catalogue grid; the prerendered body covers the
// informational sections so the content is indexable without JS.
const SUBLIMATION_FAQ = [
  {
    q: "What is sublimation printing?",
    a: "Sublimation printing uses heat to turn specialised ink into a gas that bonds with polyester fibres. The design becomes part of the fabric rather than sitting on top of it, so it cannot crack, peel or fade through repeated washing.",
  },
  {
    q: "What clothing can be sublimated?",
    a: "Polyester-rich garments print best. The range includes golf shirts, T-shirts, hooded tees, tank tops, rugby jerseys and shorts, skirts, skorts, tights, sports dresses, vests and accessories like arm sleeves. If a style is in the catalogue, it can be produced in your custom design.",
  },
  {
    q: "What is the minimum order quantity for custom sublimation?",
    a: "There is no single fixed minimum across the catalogue — sublimation is priced per production run, so the per-item cost drops as quantity grows. Sports kits and bulk teamwear orders work best; for smaller orders, enquire with your quantity and we will confirm what is possible and the price for your run size.",
  },
  {
    q: "How long does sublimation production take?",
    a: "Garments are made to order, so lead time depends on the style and quantity. Most custom kits are produced in 10 – 15 working days from artwork approval, plus courier time. Ask for a firm date when you enquire and we will confirm options for tight deadlines.",
  },
  {
    q: "Do custom sublimation colours fade?",
    a: "No printed layer sits on top of the garment — the dye is bonded into the polyester fibres, so the colours cannot crack, peel or fade the way surface prints do. Colour retention through repeated washing is one of the main reasons sports teams choose sublimation. Normal care applies: machine wash and avoid bleach.",
  },
  {
    q: "How do I get a quote?",
    a: "Use the WhatsApp quote buttons on the sublimation page, or get in touch through our contact page with the catalogue style, quantity and deadline. Send the catalogue page or product name and we can take it from there.",
  },
  {
    q: "Where are the garments made and delivered from?",
    a: "Blank2Branded is based in Mbombela (Nelspruit) in Mpumalanga, and we arrange courier delivery across South Africa. Ask us about delivery options when you enquire.",
  },
];

function renderSublimationBody(r: RouteMeta): string {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SUBLIMATION_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const faqHtml = SUBLIMATION_FAQ.map(
    (f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`,
  ).join("");
  return `
    <main>
      <article>
        <h1>Custom Sublimated Clothing and Sportswear</h1>
        <p>${esc(r.description)}</p>
        <section>
          <h2>Custom sublimated golf shirts and T-shirts</h2>
          <p>
            The range includes sublimated golfers for men and ladies in fitted, raglan and
            ringer sleeve styles, plus crew-neck and V-neck sublimated T-shirts. Hooded
            T-shirts — including a full dye-sublimation hooded style and designs with a neck
            warmer — round out the tops.
          </p>
          <p>
            Golf shirts and tees are popular for corporate days, matches, events and everyday
            branded apparel, because the full-colour design carries sponsor logos, mottos and
            artwork edge-to-edge without a heavy printed layer on top.
          </p>
          <h3>All-over print hoodies and hooded tees</h3>
          <p>
            Hooded styles take the same edge-to-edge treatment: sleeves, hood and body are
            printed as full fabric panels, so there is no blank seam or faded shoulder the way
            panel printing leaves behind.
          </p>
        </section>
        <section>
          <h2>Custom sublimated sports kits and teamwear</h2>
          <p>
            Beyond shirts, the range covers teamwear: rugby jerseys in scoop-neck and
            insert-collar styles, rugby shorts in 4-panel and 9-panel cuts, netball and sports
            dresses, skorts, running tops, cycling-ready styles, arm sleeves, athletic shorts
            and cricket pants.
          </p>
          <p>
            Schools, clubs and touring teams use these pieces to build a complete look —
            jersey, shorts and accessories all carrying the same colours, names and sponsor
            branding, dyed into the fabric so it survives season after season of washing and
            wear.
          </p>
          <h3>Sublimated soccer and rugby jerseys</h3>
          <p>
            Jerseys are where the sublimation process earns its keep — sponsor logos on the
            chest and sleeves, names and numbers on the back, and club colours straight
            through the fabric in dry-fit polyester that stays breathable under match
            conditions.
          </p>
          <h3>Netball dresses, skorts and athletics kit</h3>
          <p>
            Netball and sports dresses are cut and sewn from printed panels, so the design
            follows the garment shape rather than sitting on a flat chest print. Skorts,
            running tops and athletic shorts carry the same design across the full kit.
          </p>
          <p>
            Kitting out a whole side? See our
            <a href="/sports-kits/">sublimated sports kits for every major code</a> — soccer,
            rugby, netball, hockey, cricket and more.
          </p>
        </section>
        <section>
          <h2>How the sublimation printing process works</h2>
          <ol>
            <li><h3>Choose your style</h3><p>Browse the catalogue pages on the live page and pick the garment that suits your team or brand — golfers, tees, hoodies, jerseys, bottoms and accessories are all listed with their catalogue page.</p></li>
            <li><h3>Share your design</h3><p>Send us your artwork, logos, colours and any names or numbers. Garments are produced using client-approved designs, so nothing goes to production until you have approved the layout.</p></li>
            <li><h3>Sublimation printing</h3><p>The design is dyed deep into the dry-fit polyester and other polyester-rich fabrics using heat and pressure. Instead of an ink layer sitting on top, the colour bonds with the fibres — so the design never cracks, peels or fades the way surface prints can.</p></li>
            <li><h3>Cut, sew and finish</h3><p>Printed fabric panels are cut and sewn into finished garments, then prepared for collection or courier. Every panel is printed before assembly, which is what allows edge-to-edge, all-over coverage.</p></li>
          </ol>
        </section>
        <section>
          <h2>Ordering custom sportswear in South Africa</h2>
          <p>
            Every garment is made to your design, so an order normally starts with the style,
            the colour way and your artwork — then the quantity and size split. Enquire with
            the style, quantity and deadline, and we will confirm options for your run. Design
            work is produced only once you have approved the final design.
          </p>
          <p>
            Courier delivery is arranged across South Africa from Mbombela (Nelspruit) in
            Mpumalanga. For plain cotton garments, see our
            <a href="/blanks/">blank apparel range</a> or our
            <a href="/dtf/">DTF transfers</a>.
          </p>
        </section>
        <section>
          <h2>Sublimation clothing — questions we hear often</h2>
          ${faqHtml}
        </section>
        <p>
          <a href="/contact/">Request a quote</a> for custom sublimated clothing, or browse the
          <a href="/shop/">online shop</a>.
        </p>
      </article>
      <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
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

// /sports-kits/ — crawler-visible body matching the React page sections.
const SPORTS_KITS_FAQ = [
  {
    q: "What is a sublimated sports kit?",
    a: "A sublimated sports kit is apparel where the design, team colours, sponsor logos, names and numbers are dyed directly into the polyester fabric using heat and pressure. Unlike vinyl or screen print, the design becomes part of the fabric — it never cracks, peels or fades.",
  },
  {
    q: "How long does it take to make a custom sports kit?",
    a: "Standard turnaround for sublimated sports kits is 10 – 15 working days from artwork approval, plus courier delivery. Rush production is possible on request — get in touch for lead times on tight deadlines.",
  },
  {
    q: "What is the minimum order for sublimated kits?",
    a: "Our minimum order is 10 units per kit type. There's no maximum — we regularly produce full club sides, school teams and multi-sport orders for 100+ athletes.",
  },
  {
    q: "Do you deliver sports kits nationwide in South Africa?",
    a: "Yes. We're based in Mbombela (Mpumalanga) and courier finished kits nationwide — Johannesburg, Pretoria, Cape Town, Durban, Port Elizabeth, Bloemfontein and everywhere in between.",
  },
  {
    q: "Can I supply my own artwork or logo?",
    a: "Yes — print-ready artwork must be supplied by the client (vector or 300dpi files preferred). If you need design or layout work, we offer it as a paid service — contact us for a design fee quote before production starts.",
  },
  {
    q: "What sports do you make kits for?",
    a: "Rugby, soccer, netball, hockey, cricket, basketball, cycling, athletics and general team apparel. If you need something we haven't listed, ask — if it can be sewn from polyester, we can sublimate it.",
  },
  {
    q: "How much does a sublimated sports kit cost in South Africa?",
    a: "Pricing depends on the item (jersey vs full set), fabric weight, quantity and whether shorts/socks are included. Request a quote via WhatsApp with your quantity and we'll price it same-day.",
  },
  {
    q: "Are the kits durable and colour-fast?",
    a: "Yes. Because the ink is bonded into the polyester fibres, sublimated kits retain their colour through hundreds of wash cycles. There's no printed layer to crack, so the design lasts as long as the fabric.",
  },
];

function renderSportsKitsBody(r: RouteMeta): string {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SPORTS_KITS_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const faqHtml = SPORTS_KITS_FAQ.map(
    (f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`,
  ).join("");
  return `
    <main>
      <article>
        <h1>Custom Sports Kits &amp; Teamwear South Africa</h1>
        <p>${esc(r.description)}</p>
        <section>
          <h2>Custom kits for every code</h2>
          <p>
            Full-colour custom kits for rugby, soccer, netball, hockey, cricket, basketball,
            cycling and athletics — team names, numbers and sponsor logos dyed into the fabric.
            Mens, ladies and juniors. Full sets — jerseys, shorts, socks and tracksuits — or
            individual pieces, ordered per player or in bulk for the whole club.
          </p>
        </section>
        <section>
          <h2>Making the kit yours</h2>
          <ul>
            <li><h3>Team colours &amp; layouts</h3><p>Your exact colours across stripes, hoops, panels, fades or full-bleed designs — unlimited colours with no per-colour setup fees.</p></li>
            <li><h3>Names &amp; numbers</h3><p>Player names and numbers on every garment — each shirt in the order can be personalised at no extra design cost.</p></li>
            <li><h3>Sponsors &amp; logos</h3><p>Club crests and sponsor logos placed where you want them — front, back, sleeves or shorts. Print-ready artwork should be supplied by you.</p></li>
          </ul>
          <p>
            For every garment the sublimation process can carry — golf shirts, tees, hooded
            styles, skirts and accessories beyond team kits —
            see <a href="/sublimation/">the full sublimation range</a>.
          </p>
          <p>
            Junior and school sizing runs across the range, so one design can cover a whole
            school squad — see<a href="/blog/why-schools-sublimated-uniforms-athletics-rugby/">why schools are switching to sublimated uniforms</a>.
          </p>
        </section>
        <section>
          <h2>Enquiring for your club, school or team</h2>
          <p>The more you tell us up front, the faster and more accurate the quote. Include:</p>
          <ul>
            <li>The sport and the pieces you need — jersey only, or full set with shorts and socks</li>
            <li>Mens, ladies or junior sizes — and a rough size split for the squad</li>
            <li>Team colours and any existing crest or logo files</li>
            <li>Player names and number assignments, if you want personalisation</li>
            <li>Quantity per style, and when you need the kit by</li>
          </ul>
          <p>
            Print-ready artwork (vector or high-resolution files preferred) should be supplied
            with the order — design help is offered as a paid service, quoted before production.
            Use the WhatsApp quote buttons on the live page, or send everything through the
            <a href="/contact/">contact page</a>. We'll confirm pricing, artwork and the production
            schedule with you before anything goes to print — you approve the design proof first.
          </p>
          <p>
            Planning your first order? Our<a href="/blog/design-order-sublimated-soccer-kits-nelspruit/">soccer kit ordering guide</a> and
            <a href="/blog/ultimate-guide-sublimated-netball-uniforms-mbombela/">netball uniform guide</a>
            walk through fabrics, fits and layouts.
          </p>
        </section>
        <section>
          <h2>Frequently asked questions</h2>
          ${faqHtml}
        </section>
        <p>
          Request a quote for custom sports kits, or explore
          <a href="/sublimation/">sublimation clothing</a> and our
          <a href="/dtf/">DTF transfer service</a>.
        </p>
      </article>
      <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
      ${renderNav(r.path)}
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
  const url = SUPABASE_URL;
  const key = SUPABASE_ANON;
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
  const url = SUPABASE_URL;
  const key = SUPABASE_ANON;
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

// ---- Service pages ------------------------------------------------------------
// /services/:slug/ — rendered by src/components/ServicePageTemplate.tsx. The
// whole point of prerendering these is that the FAQPage schema, the benefits
// and the quote CTA are in the static HTML for crawlers, not injected by JS.

async function fetchServicePages(): Promise<ServicePage[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/service_pages?select=slug,title,meta_description,keyword,h1,short_title,intro,body_html,benefits_json,process_json,faq_json,related_json,blog_json,hero_image,status&status=eq.published&order=sort_order.asc`,
    { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } },
  );
  if (!res.ok) {
    console.warn("prerender-routes: service_pages fetch failed", res.status);
    return [];
  }
  try {
    const rows = (await res.json()) as Record<string, unknown>[];
    return rows.map(toServicePage);
  } catch (err) {
    console.warn("prerender-routes: service_pages parse error", err);
    return [];
  }
}

function renderServiceBody(s: ServicePage): string {
  const h1 = s.h1 || s.title;
  const label = s.short_title || s.title;
  const benefits = (Array.isArray(s.benefits_json) ? s.benefits_json : []) as ServiceBenefit[];
  const steps = (
    Array.isArray(s.process_json) && s.process_json.length > 0
      ? s.process_json
      : DEFAULT_PROCESS_STEPS
  ) as ServiceProcessStep[];
  const faq = Array.isArray(s.faq_json) ? s.faq_json : [];
  const related = Array.isArray(s.related_json) ? s.related_json : [];
  const blog = Array.isArray(s.blog_json) ? s.blog_json : [];
  const wa = `https://wa.me/27698384045?text=${encodeURIComponent(
    `Hi Blank2Branded, I'd like a quote for ${label}.`,
  )}`;
  // Bots must see a real form, not just a button.
  const quoteForm = `
        <form action="https://wa.me/27698384045" method="get">
          <p><label for="sp-name">Name</label><input id="sp-name" name="text" type="text" required placeholder="Your name" /></p>
          <p><label for="sp-message">What do you need?</label><textarea id="sp-message" name="text" required rows="4" placeholder="Quantity, sizes, deadline"></textarea></p>
          <p><button type="submit">Request a Quote</button></p>
        </form>`;

  return `
    <main>
      <section>
        <p>Our Services</p>
        <h1>${esc(h1)}</h1>
        ${s.intro ? `<p>${esc(s.intro)}</p>` : ""}
        <p><a href="#quote">Request a Quote</a> · <a href="${wa}" rel="noopener noreferrer">WhatsApp us</a></p>
        <p>Call +27 69 838 4045 · Courier nationwide · Quotes in 4 business hours</p>
        <div id="quote">${quoteForm}</div>
      </section>

      ${s.body_html || ""}

      ${
        benefits.length > 0
          ? `<section><h2>Why choose ${esc(label)}</h2><ul>${benefits
              .map((b) => `<li><h3>${esc(b.title)}</h3><p>${esc(b.description)}</p></li>`)
              .join("")}</ul></section>`
          : ""
      }

      <section>
        <h2>How it works</h2>
        <p>Four steps from enquiry to delivery. You approve a design proof before anything goes into production.</p>
        <ol>${steps
          .map(
            (st) =>
              `<li><h3>Step ${st.step}: ${esc(st.title)}</h3><p>${esc(st.description)}</p></li>`,
          )
          .join("")}</ol>
      </section>

      ${
        faq.length > 0
          ? `<section><h2>Frequently asked questions</h2>${faq
              .map(
                (f) =>
                  `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`,
              )
              .join("")}</section>`
          : ""
      }

      <section>
        <h2>Ready to start your ${esc(label.toLowerCase())} order?</h2>
        <p>Send your artwork or brief, and we'll come back with a quote within 4 business hours.</p>
        <p><a href="${wa}" rel="noopener noreferrer">WhatsApp us</a> · <a href="tel:+27698384045">+27 69 838 4045</a> · Mon–Fri 8am–4pm · Mbombela, Mpumalanga</p>
        ${quoteForm}
      </section>

      ${
        related.length > 0
          ? `<section><h2>Related services</h2><ul>${related
              .map(
                (r) =>
                  `<li><a href="${esc(resolveRelatedHref(r.slug))}"><h3>${esc(r.title)}</h3></a>${r.description ? `<p>${esc(r.description)}</p>` : ""}</li>`,
              )
              .join("")}</ul></section>`
          : ""
      }

      ${
        blog.length > 0
          ? `<section><h2>${esc(label)} guides &amp; tips</h2><ul>${blog
              .map((b) => `<li><a href="${esc(resolveBlogHref(b.slug))}">${esc(b.title)}</a></li>`)
              .join("")}</ul><p><a href="/blog/">Read all articles</a></p></section>`
          : ""
      }
    </main>`;
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

  // Service pages (/services/:slug/)
  const servicePages = await fetchServicePages();
  for (const s of servicePages) {
    const path = `/services/${s.slug}`;
    const r: RouteMeta = {
      path,
      title: s.title,
      description: s.meta_description || "",
      keywords: s.keyword || undefined,
      jsonLd: buildServiceJsonLd(s, BASE_URL),
      // Same marker the runtime route clears before injecting, so hydration
      // replaces the prerendered schema instead of duplicating it.
      jsonLdAttr: "data-service-ld",
    };
    const html = injectBody(rewriteHead(template, r), renderServiceBody(s));
    const out = resolve(distDir, "services", s.slug, "index.html");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    written++;
  }

  console.log(
    `prerender-routes: wrote ${written} prerendered pages (${staticRoutes.length} static + ${products.length} products + ${bofuPages.length} BOFU + ${servicePages.length} service + root); ${Object.keys(overrides).length} route_meta overrides applied`,
  );
}

main().catch((e) => {
  console.error("prerender-routes failed:", e);
});

