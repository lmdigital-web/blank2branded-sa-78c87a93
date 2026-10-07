/**
 * Toggles <meta name="robots"> between indexable and noindex on the current page.
 *
 * The site is a static SPA served with a 200 index.html fallback, so a URL for
 * a product/post/page that no longer exists still returns HTTP 200. Google
 * reports those as "Soft 404". Marking the rendered not-found state as noindex
 * tells Google to drop the URL instead of keeping it in the crawl queue.
 *
 * The existing tag is MUTATED rather than a second one appended: index.html
 * already ships a robots meta, and emitting a conflicting pair makes Google
 * flag the directives in Search Console and makes naive tooling read the
 * indexable one.
 */

const MANAGED_ID = "robots-noindex";
const INDEXABLE = "index, follow, max-image-preview:large";
const NOINDEX = "noindex, follow, max-image-preview:large";

export function setNoindex(active: boolean) {
  if (typeof document === "undefined") return;

  // Collapse any duplicates down to the first tag so we never leave a
  // conflicting pair behind.
  const all = Array.from(
    document.head.querySelectorAll<HTMLMetaElement>('meta[name="robots" i]'),
  );
  const el = all[0] ?? (() => {
    const created = document.createElement("meta");
    created.name = "robots";
    document.head.appendChild(created);
    return created;
  })();
  all.slice(1).forEach((dup) => dup.remove());

  el.id = MANAGED_ID;
  el.content = active ? NOINDEX : INDEXABLE;
}