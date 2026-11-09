// Runtime head management for routes that own their own SEO (BOFU comparison
// pages and /services/:slug/).
//
// App.tsx's applySeo() deliberately skips these paths so it can't stamp the
// homepage canonical over them — which means these routes must set the
// canonical themselves. Without this, a client-side navigation between two such
// pages leaves the previous page's canonical in <head>, i.e. page B declaring
// itself to be page A.

export function setMeta(attr: "name" | "property", key: string, content: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}" i]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export type SeoHead = {
  title: string;
  description: string;
  url: string;
  keywords?: string | null;
};

/** Sets canonical + OG/Twitter tags for a route that manages its own head. */
export function setRouteSeo({ title, description, url, keywords }: SeoHead) {
  if (typeof document === "undefined") return;
  document.title = title;

  setMeta("name", "description", description);
  if (keywords) setMeta("name", "keywords", keywords);

  let canonical = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = url;

  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", url);
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
}