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
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
  h1?: string;
  description: string;
  keywords?: string;
  image?: string;
  ogType?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  bodyHtml?: string;
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
    title: "Sublimation Printing South Africa | Custom Clothing & Sportswear",
    h1: "Custom Sublimation Printing & Clothing in South Africa",
    description:
      "Custom sublimated clothing and sportswear from Blank2Branded. Custom designs for schools, sports teams and businesses. Based in Mbombela, delivering nationwide.",
    keywords:
      "sublimation printing South Africa, custom sublimated clothing, custom sublimated sportswear, sublimated sports kits, sublimation printing Mbombela, custom sublimated golf shirts, sublimated rugby jerseys, custom netball dresses, custom soccer kits",
    bodyHtml: `
      <p>Blank2Branded creates custom sublimated clothing and sportswear for schools, sports clubs, businesses, teams and organisations. We are based in Mbombela, Mpumalanga, and serve customers throughout South Africa.</p>
      <h2>Professional Sublimation Printing for Custom Clothing</h2>
      <p>Sublimation printing transfers a full-colour design into suitable polyester-based fabric using heat. The design becomes part of the fabric rather than a separate print layer on its surface. Fabric choice matters: not every fabric is suitable, and options vary by garment.</p>
      <h2>Custom Sublimated Sportswear</h2>
      <p>The supplied catalogue includes t-shirts, golf shirts, rugby jerseys, hooded t-shirts, shorts, dresses, skirts and other sportswear styles. Our <a href="/sports-kits/">sports kits page</a> also covers soccer and netball teamwear. Availability and fabric options vary by style; contact us to discuss your requirements.</p>
      <h2>Sublimation Clothing for Schools, Clubs &amp; Businesses</h2>
      <p>Discuss coordinated garments with colours and branding incorporated into the design for school teams, clubs, businesses and organisations. Blank2Branded is based in Mbombela, Mpumalanga, and serves customers throughout South Africa.</p>
      <h2>Why Choose Sublimation Printing?</h2>
      <ul><li>Full-colour designs and detailed graphics</li><li>Team colours and branding can be incorporated into an appropriate garment design</li><li>On suitable polyester-based fabric, the design is transferred into the fabric rather than applied as a separate surface print</li></ul>
      <h2>How the Sublimation Process Works</h2>
      <ol><li>Share your garment style, quantity, sizes, colours and artwork requirements.</li><li>Discuss material options and confirm the design requirements with us.</li><li>Once the design and order details are agreed, sublimation production proceeds; contact us to discuss delivery arrangements.</li></ol>
      <h2>Ordering Custom Sublimated Clothing</h2>
      <p>Send us the garment style, quantity, size range and design details you are considering. You can share existing artwork or discuss your design requirements with our team. <a href="https://wa.me/27698384045">Request a quotation on WhatsApp</a> or use our <a href="/contact/">contact page</a>.</p>
      <p>Browse our <a href="/blanks/">blank apparel</a> or see our <a href="/dtf/">DTF printing service</a> if you are considering a different print method.</p>
      <h2>Frequently Asked Questions</h2>
      <h3>What is sublimation printing and how does it work?</h3>
      <p>Sublimation printing uses heat to transfer a full-colour design into a suitable polyester-based fabric. The design becomes part of the fabric rather than a separate print layer on its surface.</p>
      <h3>What garments are available for custom sublimation?</h3>
      <p>The sublimation catalogue includes t-shirts, golf shirts, rugby jerseys, hooded t-shirts, shorts, dresses, skirts and other sportswear styles. Browse the catalogue or contact us to discuss a garment and its options.</p>
      <h3>Can any fabric be sublimated?</h3>
      <p>No. Sublimation is suited to appropriate polyester-based fabrics, and fabric suitability varies by garment. Tell us which style you are considering so we can discuss its material options.</p>
      <h3>Can we include team colours, logos and detailed artwork?</h3>
      <p>Custom artwork can be incorporated into the garment design. Share your logo, colours, artwork and garment requirements when you enquire, and we can discuss the design with you.</p>
      <h3>How do I request a quote?</h3>
      <p>Contact Blank2Branded with the garment style, quantity, sizes and design requirements you have in mind. You can enquire through WhatsApp or our contact page, and we will discuss the available options with you.</p>
      <h3>Where does Blank2Branded deliver?</h3>
      <p>Blank2Branded is based in Mbombela, Mpumalanga, and serves customers throughout South Africa. Contact us with your location and requirements to discuss delivery for your order.</p>
    `,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Custom Sublimation Printing & Clothing",
        serviceType: "Sublimation printing for custom clothing and sportswear",
        provider: {
          "@type": "Organization",
          name: "Blank2Branded",
          url: "https://blank2branded.co.za/",
        },
        areaServed: [
          { "@type": "City", name: "Mbombela" },
          { "@type": "Country", name: "South Africa" },
        ],
        url: "https://blank2branded.co.za/sublimation/",
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is sublimation printing and how does it work?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Sublimation printing uses heat to transfer a full-colour design into a suitable polyester-based fabric. The design becomes part of the fabric rather than a separate print layer on its surface.",
            },
          },
          {
            "@type": "Question",
            name: "What garments are available for custom sublimation?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The sublimation catalogue includes t-shirts, golf shirts, rugby jerseys, hooded t-shirts, shorts, dresses, skirts and other sportswear styles. Browse the catalogue or contact us to discuss a garment and its options.",
            },
          },
          {
            "@type": "Question",
            name: "Can any fabric be sublimated?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Sublimation is suited to appropriate polyester-based fabrics, and fabric suitability varies by garment. Tell us which style you are considering so we can discuss its material options.",
            },
          },
          {
            "@type": "Question",
            name: "Can we include team colours, logos and detailed artwork?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Custom artwork can be incorporated into the garment design. Share your logo, colours, artwork and garment requirements when you enquire, and we can discuss the design with you.",
            },
          },
          {
            "@type": "Question",
            name: "How do I request a quote?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Contact Blank2Branded with the garment style, quantity, sizes and design requirements you have in mind. You can enquire through WhatsApp or our contact page, and we will discuss the available options with you.",
            },
          },
          {
            "@type": "Question",
            name: "Where does Blank2Branded deliver?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Blank2Branded is based in Mbombela, Mpumalanga, and serves customers throughout South Africa. Contact us with your location and requirements to discuss delivery for your order.",
            },
          },
        ],
      },
    ],
  },
  {
    path: "/catalogues",
    title: "Catalogues | Branded Gifts, Bags & Corporate Gifting South Africa | Blank2Branded",
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
    title: "Sublimated Sports Kits South Africa | Custom Rugby, Netball & Soccer Kits",
    h1: "Custom Sublimated Sports Kits & Teamwear — South Africa",
    description:
      "Custom sublimated sports kits for rugby, soccer, netball, cricket and hockey teams. Discuss your design requirements and request a quote from Blank2Branded, based in Mbombela and serving South Africa.",
    keywords:
      "sublimated sports kits, sublimated sports kits South Africa, custom sports kits, sublimated jerseys, sublimated rugby jerseys, sublimated soccer kits, sublimated netball dresses, custom team kits South Africa, custom sports uniforms, school sports kits South Africa",
    bodyHtml: `
      <p>Custom sublimated team uniforms and club kits for rugby, soccer, netball, hockey, cricket, basketball, cycling and athletics. We work with schools and teams to print names, numbers and sponsors into the fabric, then courier nationwide from Mbombela.</p>
      <h2><a href="/blog/sublimated-sports-kits/">Sublimated Sports Kits: A Guide</a></h2>
      <p>Read our guide to custom sublimated sports kits for an overview of kit design and key considerations. Contact us to discuss the requirements for your sport and team.</p>
      <h2>Design your own kit in 3 steps</h2>
      <ol>
        <li>Send your design or logo, team colours, sizes and quantity.</li>
        <li>We prepare a mock-up for approval and provide a quote.</li>
        <li>We print your approved kit and arrange nationwide delivery.</li>
      </ol>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is a sublimated sports kit?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A sublimated sports kit uses a full-colour design incorporated into suitable polyester-based fabric using heat. Team colours, logos, names and numbers can be included in the garment design; fabric suitability varies by style.",
          },
        },
        {
          "@type": "Question",
          name: "How long does it take to make a custom sports kit?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Production and courier timing depend on your order requirements. Contact us to discuss the expected timing for your order.",
          },
        },
        {
          "@type": "Question",
          name: "What is the minimum order for sublimated kits?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Order requirements depend on the garment and design. Contact us to discuss the quantity you have in mind.",
          },
        },
        {
          "@type": "Question",
          name: "Do you deliver sports kits nationwide in South Africa?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Blank2Branded is based in Mbombela, Mpumalanga, and arranges courier delivery throughout South Africa. Contact us to discuss delivery options for your order.",
          },
        },
        {
          "@type": "Question",
          name: "Can I supply my own artwork or logo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Share your artwork or logo with us when requesting a quote. We can discuss the requirements for your design and order.",
          },
        },
        {
          "@type": "Question",
          name: "What sports do you make kits for?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The range shown includes rugby, soccer, netball, hockey, cricket, basketball, cycling and athletics styles. Ask us about other garment styles; suitability depends on the fabric.",
          },
        },
        {
          "@type": "Question",
          name: "How much does a sublimated sports kit cost in South Africa?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Pricing depends on the garment, design and quantity. Request a quotation through WhatsApp or our contact page with your requirements.",
          },
        },
        {
          "@type": "Question",
          name: "How does sublimation differ from a surface print?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "On suitable fabric, the design is transferred into the material rather than applied as a separate surface print. Fabric and garment suitability varies by style, so contact us to discuss a specific option.",
          },
        },
      ],
    },
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
    (p.description || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
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
                handlingTime: {
                  "@type": "QuantitativeValue",
                  minValue: 1,
                  maxValue: 3,
                  unitCode: "DAY",
                },
                transitTime: {
                  "@type": "QuantitativeValue",
                  minValue: 2,
                  maxValue: 5,
                  unitCode: "DAY",
                },
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
  const rootWithChildren =
    /(<div\s+id="(?:root|app)"[^>]*>)[\s\S]*?(<\/div>)(?=\s*(?:<script|<\/body>))/i;
  if (rootWithChildren.test(html)) {
    return html.replace(rootWithChildren, (_m, open, close) => `${open}${bodyHtml}${close}`);
  }
  const emptyRoot = /<div\s+id="(?:root|app)"[^>]*>\s*<\/div>/i;
  if (emptyRoot.test(html)) {
    return html.replace(emptyRoot, (m) => m.replace(/>\s*<\/div>/i, `>${bodyHtml}</div>`));
  }
  return html.replace(
    /<\/body>/i,
    `<div id="prerender-fallback" hidden>${bodyHtml}</div>\n  </body>`,
  );
}

const SITE_NAV_LINKS: Array<{ path: string; label: string }> = [
  { path: "/", label: "Home" },
  { path: "/shop", label: "Shop" },
  { path: "/blanks", label: "Blank Apparel" },
  { path: "/dtf", label: "DTF Transfers" },
  { path: "/sublimation", label: "Sublimation" },
  { path: "/sports-kits", label: "Sports Kits" },
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
  if (!r.bodyHtml && r.path === "/sublimation") return renderSublimationBody(r);
  if (!r.bodyHtml && r.path === "/sports-kits") return renderSportsKitsBody(r);

  const h1 = r.h1 ?? r.title.split("|")[0].trim();
  const articleContent =
    r.bodyHtml ??
    `
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
        </p>`;
  return `
    <main>
      <article>
        <h1>${esc(h1)}</h1>
        ${articleContent}
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
    a: "Sublimation printing uses heat to transfer a full-colour design into suitable polyester-based fabric. The design becomes part of the fabric rather than a separate print layer on its surface.",
  },
  {
    q: "What clothing can be sublimated?",
    a: "The catalogue includes golf shirts, T-shirts, hooded styles, rugby jerseys, shorts, dresses, skirts and other sportswear. Fabric suitability varies by garment; contact us to discuss a style.",
  },
  {
    q: "Can any fabric be sublimated?",
    a: "No. Sublimation is suited to appropriate polyester-based fabrics, and fabric suitability varies by garment. Tell us which style you are considering so we can discuss its material options.",
  },
  {
    q: "Can artwork and branding be included?",
    a: "Custom artwork can be incorporated into an appropriate garment design. Share your logo, colours, artwork and garment requirements when you enquire so we can discuss the options.",
  },
  {
    q: "How do I request a quote?",
    a: "Contact Blank2Branded with the garment style, quantity, sizes and design requirements you have in mind. You can enquire through WhatsApp or our contact page, and we will discuss the available options with you.",
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
            artwork as part of the garment design.
          </p>
          <h3>All-over print hoodies and hooded tees</h3>
          <p>
            Catalogue-listed hooded styles include a full dye-sublimation option and designs
            with a neck warmer. Ask us to confirm the fabric and design options for a style.
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
            jersey, shorts and accessories can carry coordinated colours, names and sponsor
            branding as part of the design. Fabric suitability varies by style.
          </p>
          <h3>Sublimated soccer and rugby jerseys</h3>
          <p>
            Jerseys are where the sublimation process earns its keep — sponsor logos on the
            chest and sleeves, names and numbers on the back, and club colours included in
            the garment design. Discuss fabric options for the style you are considering.
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
            <li><h3>Sublimation printing</h3><p>On suitable polyester-based fabric, heat transfers the design into the material rather than applying a separate print layer to its surface. Fabric suitability varies by garment.</p></li>
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
  const priceStr = p.base_price
    ? `${p.currency_code || "ZAR"} ${Number(p.base_price).toFixed(2)}`
    : "";
  const desc = (p.description || r.description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    a: "A sublimated sports kit uses a full-colour design incorporated into suitable polyester-based fabric using heat. Team colours, logos, names and numbers can be included in the garment design; fabric suitability varies by style.",
  },
  {
    q: "How long does it take to make a custom sports kit?",
    a: "Production and courier timing depend on your order requirements. Contact us to discuss the expected timing for your order.",
  },
  {
    q: "What is the minimum order for sublimated kits?",
    a: "Order requirements depend on the garment and design. Contact us to discuss the quantity you have in mind.",
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
    a: "The range shown includes rugby, soccer, netball, hockey, cricket, basketball, cycling and athletics styles. Ask us about other garment styles; suitability depends on the fabric.",
  },
  {
    q: "How much does a sublimated sports kit cost in South Africa?",
    a: "Pricing depends on the garment, design and quantity. Request a quotation through WhatsApp or our contact page with your requirements.",
  },
  {
    q: "How does sublimation differ from a surface print?",
    a: "On suitable fabric, the design is transferred into the material rather than applied as a separate surface print. Fabric and garment suitability varies by style, so contact us to discuss a specific option.",
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
            <li><h3>Team colours &amp; layouts</h3><p>Discuss stripes, hoops, panels, fades or full-bleed patterns as part of your team's design.</p></li>
            <li><h3>Names &amp; numbers</h3><p>Player names and numbers can be included in the design. Share the details with us when requesting a quote.</p></li>
            <li><h3>Sponsors &amp; logos</h3><p>Club crests and sponsor logos placed where you want them — front, back, sleeves or shorts. Print-ready artwork should be supplied by you.</p></li>
          </ul>
          <p>
            For every garment the sublimation process can carry — golf shirts, tees, hooded
            styles, skirts and accessories beyond team kits —
            see <a href="/sublimation/">the full sublimation range</a>.
          </p>
          <p>
            Junior and school sizing runs across the range, so one design can cover a whole
            school squad — read our <a href="/blog/sublimated-sports-kits/">sublimated sports kits guide</a>.
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
            Planning your first order? Read our <a href="/blog/sublimated-sports-kits/">sublimated sports kits guide</a>
            for general design considerations.
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
    const res = await fetch(
      `${url}/rest/v1/route_meta?select=slug,title,description,canonical,og_image`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      },
    );
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
  if (r.path === "/" || r.path === "/sublimation") {
    return { ...r, image: o.og_image || r.image };
  }
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
    const res = await fetch(
      `${url}/rest/v1/bofu_pages?select=slug,template,title,meta_description,h1,intro,body_html,video_embed_html,video_url,faq_json,city&status=eq.published`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      },
    );
    if (!res.ok) {
      console.warn("prerender-routes: bofu fetch failed", res.status);
      return [];
    }
    return (await res.json()) as BofuPage[];
  } catch (err) {
    console.warn("prerender-routes: bofu fetch error", err);
    return [];
  }
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
  const out: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: b.title,
      description: b.meta_description || "",
      url,
    },
  ];
  const faq = Array.isArray(b.faq_json) ? b.faq_json : [];
  if (faq.length > 0) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
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
    console.warn("prerender-routes: dist/index.html not found — skipping (run after vite build)");
    return;
  }
  const template = readFileSync(templatePath, "utf8");

  const overrides = await fetchRouteOverrides();

  const rootRoute: RouteMeta = applyOverride(
    {
      path: "/",
      title: "DTF Printing, Blank Apparel & Custom Clothing South Africa | Blank2Branded",
      h1: "Custom Apparel, DTF Printing & Branding Solutions in South Africa",
      description:
        "Shop DTF transfers and blank apparel, or order custom sublimated workwear and sportswear. Blank2Branded supplies South Africa from Mbombela with nationwide delivery.",
      keywords:
        "DTF printing South Africa, DTF transfers South Africa, blank apparel suppliers South Africa, custom apparel South Africa, custom clothing printing South Africa, branded clothing South Africa, sublimation printing South Africa, DTF printing Mbombela, blank t-shirts South Africa, custom sublimated clothing, corporate workwear South Africa, custom sportswear South Africa, branded golf shirts South Africa",
      bodyHtml: `
        <p>Blank2Branded is an apparel, printing and branding supplier based in Mbombela, Mpumalanga, serving customers throughout South Africa. We support clothing brands, businesses, schools, sports teams, resellers and individuals.</p>
        <h2>DTF Transfers</h2>
        <p>We produce DTF transfers in-house to your requirements. Standalone transfers can be ordered by the metre or by individual image, with no minimum quantity. Courier delivery is available at the customer's expense. <a href="/dtf/">Explore DTF printing</a>.</p>
        <h2>Blank Apparel</h2>
        <p>Browse available blank T-shirts, golf shirts, hoodies, sweatshirts and other apparel in our product ranges and <a href="/shop/">online shop</a>.</p>
        <h2>Custom Sublimation Printing</h2>
        <p>Explore custom sublimated golf shirts, work T-shirts, rugby jerseys, soccer kits, netball dresses and other suitable polyester-based apparel for businesses, schools, clubs, teams and organisations. Fabric suitability varies by garment. <a href="/sublimation/">Explore custom sublimated clothing and sportswear</a>.</p>
        <h2>Corporate Branding &amp; Display</h2>
        <p>Explore branded apparel, corporate gifts, promotional products, display and signage solutions. Browse <a href="/catalogues/">corporate catalogues</a> or <a href="/display/">display and signage</a>.</p>
        <h2>How It Works</h2>
        <ol><li>Choose a product or service.</li><li>Send your requirements and artwork.</li><li>Review and approve the quotation and artwork.</li><li>Production and delivery arrangements follow.</li></ol>
        <p>For teamwear, explore our <a href="/sports-kits/">sports kits</a>. <a href="/contact/">Contact us</a> or <a href="https://wa.me/27698384045">request a quote on WhatsApp</a>.</p>
      `,
    },
    overrides["/"],
  );
  writeFileSync(
    templatePath,
    injectBody(rewriteHead(template, rootRoute), renderStaticBody(rootRoute)),
  );

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
    const path =
      b.template === "local"
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
