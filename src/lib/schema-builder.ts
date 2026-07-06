// Automatic JSON-LD Schema Engine
// Centralised builders so every page ships consistent, valid schema.

export const SITE_URL = "https://blank2branded.co.za";
export const ORG_NAME = "Blank2Branded";
export const ORG_LOGO = `${SITE_URL}/logo.png`;

export type AuthorProfile = {
  name: string;
  slug?: string | null;
  bio?: string | null;
  credentials?: string | null;
  avatar_url?: string | null;
  website?: string | null;
  social?: Record<string, string> | null;
};

export type ArticleInput = {
  title: string;
  description: string;
  slug: string;
  image?: string | null;
  publishedAt?: string | null;
  modifiedAt?: string | null;
  keywords?: string | null;
  author?: AuthorProfile | null;
};

export type ProductInput = {
  title: string;
  description: string;
  handle: string;
  image?: string | null;
  price?: string | number | null;
  currency?: string | null;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  sku?: string | null;
  brand?: string | null;
};

export type Crumb = { name: string; url: string };

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    url: SITE_URL,
    logo: ORG_LOGO,
  };
}

export function authorNode(author?: AuthorProfile | null) {
  if (!author) return { "@type": "Organization", name: ORG_NAME };
  const sameAs = author.social
    ? Object.values(author.social).filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];
  return {
    "@type": "Person",
    name: author.name,
    ...(author.bio ? { description: author.bio } : {}),
    ...(author.credentials ? { jobTitle: author.credentials } : {}),
    ...(author.avatar_url ? { image: author.avatar_url } : {}),
    ...(author.website ? { url: author.website } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function articleSchema(input: ArticleInput) {
  const url = `${SITE_URL}/blog/${input.slug}/`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    ...(input.image ? { image: [input.image] } : {}),
    ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
    ...(input.modifiedAt ? { dateModified: input.modifiedAt } : {}),
    ...(input.keywords ? { keywords: input.keywords } : {}),
    author: authorNode(input.author),
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: { "@type": "ImageObject", url: ORG_LOGO },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export function productSchema(input: ProductInput) {
  const url = `${SITE_URL}/products/${input.handle}/`;
  const offers =
    input.price != null
      ? {
          offers: {
            "@type": "Offer",
            url,
            price: String(input.price),
            priceCurrency: input.currency || "ZAR",
            availability: `https://schema.org/${input.availability || "InStock"}`,
          },
        }
      : {};
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.title,
    description: input.description,
    ...(input.image ? { image: [input.image] } : {}),
    ...(input.sku ? { sku: input.sku } : {}),
    brand: { "@type": "Brand", name: input.brand || ORG_NAME },
    ...offers,
  };
}

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

// Inject one or more JSON-LD blocks. Reuses tagged <script> nodes by id so
// route changes don't pile up duplicates.
export function injectJsonLd(id: string, schema: unknown) {
  if (typeof document === "undefined") return;
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(schema);
}

export function removeJsonLd(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.remove();
}
