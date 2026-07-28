/**
 * Toggles <meta name="robots" content="noindex,follow"> on the current page.
 *
 * The site is a static SPA served with a 200 index.html fallback, so a URL for
 * a product/post/page that no longer exists still returns HTTP 200. Google
 * reports those as "Soft 404". Marking the rendered not-found state as noindex
 * tells Google to drop the URL instead of keeping it in the crawl queue.
 */
export function setNoindex(active: boolean) {
  if (typeof document === "undefined") return;
  const id = "robots-noindex";
  const existing = document.head.querySelector<HTMLMetaElement>(`meta#${id}`);
  if (active) {
    if (existing) return;
    const el = document.createElement("meta");
    el.id = id;
    el.name = "robots";
    el.content = "noindex,follow";
    document.head.appendChild(el);
  } else if (existing) {
    existing.remove();
  }
}
