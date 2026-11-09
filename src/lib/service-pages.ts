// Service pages — content model and helpers shared by the runtime route
// (src/routes/services.$slug.tsx) and the build-time prerenderer
// (scripts/prerender-routes.ts). Keep both sides in sync: the prerendered
// HTML is what crawlers actually see.

export type ServiceBenefit = {
  title: string;
  description: string;
};

export type ServiceProcessStep = {
  step: number;
  title: string;
  description: string;
};

export type ServiceFaq = {
  q: string;
  a: string;
};

export type ServiceRelated = {
  slug: string;
  title: string;
  description?: string;
};

export type ServiceBlogLink = {
  slug: string;
  title: string;
};

export type ServicePage = {
  id?: string;
  slug: string;
  title: string;
  meta_description: string | null;
  keyword: string | null;
  h1: string | null;
  short_title: string | null;
  intro: string | null;
  body_html: string | null;
  benefits_json: ServiceBenefit[] | null;
  process_json: ServiceProcessStep[] | null;
  faq_json: ServiceFaq[] | null;
  related_json: ServiceRelated[] | null;
  blog_json: ServiceBlogLink[] | null;
  hero_image: string | null;
  status: string;
};

export const SERVICE_PAGE_SELECT =
  "slug,title,meta_description,keyword,h1,short_title,intro,body_html,benefits_json,process_json,faq_json,related_json,blog_json,hero_image,status";

/** The four standard steps every service page gets unless it overrides them. */
export const DEFAULT_PROCESS_STEPS: ServiceProcessStep[] = [
  {
    step: 1,
    title: "Enquire",
    description:
      "Send us your quantity, sizes, garment choice and deadline. WhatsApp, email or the quote form below — you get pricing back within 4 business hours.",
  },
  {
    step: 2,
    title: "Design proof",
    description:
      "Upload your artwork or brief our designers. We return a digital proof so you can approve placement, sizing and colours before anything goes to production.",
  },
  {
    step: 3,
    title: "Production",
    description:
      "Once the proof is approved we print, press or cut your order in Mbombela. Quality is checked by hand before anything is packed.",
  },
  {
    step: 4,
    title: "Delivery",
    description:
      "Packed and couriered nationwide. You get tracking details, with collection available if you would rather save the shipping.",
  },
];

export function serviceUrl(slug: string): string {
  return `/services/${slug}/`;
}

/**
 * Related-services entries may point at another service page (by slug) or at an
 * existing top-level route. A value starting with "/" is treated as a literal
 * path; anything else is assumed to be a service slug.
 */
export function resolveRelatedHref(slug: string): string {
  return slug.startsWith("/") ? slug : serviceUrl(slug);
}

/** Blog links use the same rule, so a full path like "/blog/x/" also works. */
export function resolveBlogHref(slug: string): string {
  return slug.startsWith("/") ? slug : `/blog/${slug}/`;
}

/** Slugs must stay crawlable — lowercase words joined by single hyphens. */
export function isValidServiceSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

export function parseServiceSlug(path: string): string | null {
  const m = path.replace(/\/$/, "").match(/^\/services\/([^/]+)$/);
  if (!m) return null;
  return isValidServiceSlug(m[1]) ? m[1] : null;
}

// PostgREST types the jsonb columns as `Json`, and an editor can put anything in
// them. Everything below narrows and validates at runtime rather than casting,
// so a malformed row degrades to "section omitted" instead of crashing a page.

function arr(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v.filter((x) => x && typeof x === "object") as Record<string, unknown>[]) : [];
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function strOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

export function serviceProcessSteps(page: {
  process_json?: unknown;
}): ServiceProcessStep[] {
  const custom = arr(page.process_json)
    .map((r, i) => ({
      step: typeof r.step === "number" ? r.step : i + 1,
      title: str(r.title),
      description: str(r.description),
    }))
    .filter((s) => s.title !== "");
  return custom.length > 0 ? custom : DEFAULT_PROCESS_STEPS;
}

export function serviceFaqs(page: { faq_json?: unknown }): ServiceFaq[] {
  return arr(page.faq_json)
    .map((r) => ({ q: str(r.q), a: str(r.a) }))
    .filter((f) => f.q !== "" && f.a !== "");
}

export function serviceBenefits(page: { benefits_json?: unknown }): ServiceBenefit[] {
  return arr(page.benefits_json)
    .map((r) => ({ title: str(r.title), description: str(r.description) }))
    .filter((b) => b.title !== "");
}

export function serviceRelated(page: { related_json?: unknown }): ServiceRelated[] {
  return arr(page.related_json)
    .map((r) => ({
      slug: str(r.slug),
      title: str(r.title),
      description: strOrNull(r.description) ?? undefined,
    }))
    .filter((r) => r.slug !== "" && r.title !== "");
}

export function serviceBlogLinks(page: { blog_json?: unknown }): ServiceBlogLink[] {
  return arr(page.blog_json)
    .map((r) => ({ slug: str(r.slug), title: str(r.title) }))
    .filter((b) => b.slug !== "" && b.title !== "");
}

/** Coerce a raw PostgREST row into the typed model the template renders. */
export function toServicePage(row: Record<string, unknown>): ServicePage {
  return {
    id: typeof row.id === "string" ? row.id : undefined,
    slug: str(row.slug),
    title: str(row.title),
    meta_description: strOrNull(row.meta_description),
    keyword: strOrNull(row.keyword),
    h1: strOrNull(row.h1),
    short_title: strOrNull(row.short_title),
    intro: strOrNull(row.intro),
    body_html: strOrNull(row.body_html),
    benefits_json: serviceBenefits(row),
    process_json: serviceProcessSteps(row),
    faq_json: serviceFaqs(row),
    related_json: serviceRelated(row),
    blog_json: serviceBlogLinks(row),
    hero_image: strOrNull(row.hero_image),
    status: str(row.status),
  };
}

/**
 * JSON-LD for a service page: WebPage + Service + FAQPage.
 * The FAQPage block is the whole reason this exists — it must be present in
 * the prerendered HTML, not injected at runtime after hydration.
 */
export function buildServiceJsonLd(
  page: {
    slug: string;
    title: string;
    meta_description: string | null;
    intro?: string | null;
    keyword?: string | null;
    faq_json?: unknown;
  },
  siteUrl: string,
): Record<string, unknown>[] {
  const url = `${siteUrl}${serviceUrl(page.slug)}`;
  const out: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.meta_description || "",
      url,
      about: { "@type": "Service", name: page.title },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.title,
      description: page.meta_description || page.intro || "",
      serviceType: page.keyword || page.title,
      provider: {
        "@type": "LocalBusiness",
        name: "Blank2Branded",
        url: siteUrl,
        telephone: "+27698384045",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Mbombela",
          addressRegion: "Mpumalanga",
          addressCountry: "ZA",
        },
        areaServed: { "@type": "Country", name: "South Africa" },
      },
      areaServed: { "@type": "Country", name: "South Africa" },
      url,
    },
  ];

  const faq = serviceFaqs(page);
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

  return out;
}