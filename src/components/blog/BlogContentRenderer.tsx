import { useMemo } from "react";
import { ShopifyProductCard } from "./ShopifyProductCard";
import { SHOPIFY_STORE_PERMANENT_DOMAIN } from "@/lib/shopify";

type Props = { html: string; postId?: string | null };

const SHOP_ORIGINS = [
  "blank2branded.co.za",
  "www.blank2branded.co.za",
  SHOPIFY_STORE_PERMANENT_DOMAIN,
];

function extractHandle(url: string): string | null {
  try {
    const u = new URL(url, "https://blank2branded.co.za");
    const m = u.pathname.match(/\/products\/([^/?#]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

function isShopHref(href: string): boolean {
  if (href.startsWith("/products/") || href.startsWith("/collections/")) return true;
  try {
    const u = new URL(href);
    return SHOP_ORIGINS.some((d) => u.hostname.endsWith(d));
  } catch {
    return false;
  }
}

/** Parses blog HTML, swaps product embed placeholders with live cards
 *  and rewrites outbound shop links through the click-tracking redirect. */
export function BlogContentRenderer({ html, postId }: Props) {
  const parts = useMemo(() => parseHtml(html, postId ?? null), [html, postId]);

  return (
    <div className="prose prose-slate mt-8 max-w-none prose-headings:font-bold prose-a:text-primary">
      {parts.map((p, i) =>
        p.type === "html" ? (
          <div key={i} dangerouslySetInnerHTML={{ __html: p.html }} />
        ) : (
          <ShopifyProductCard key={i} handle={p.handle} postId={postId ?? null} />
        ),
      )}
    </div>
  );
}

type Part = { type: "html"; html: string } | { type: "product"; handle: string };

function parseHtml(html: string, postId: string | null): Part[] {
  if (typeof document === "undefined") return [{ type: "html", html }];

  const container = document.createElement("div");
  container.innerHTML = html;

  // 1. Rewrite outbound shop links to redirect for click tracking
  if (postId) {
    container.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (!isShopHref(href)) return;
      const handle = extractHandle(href);
      if (handle) {
        a.setAttribute("href", `/r/blog/${postId}/${handle}`);
      } else {
        // append ref param for non-product shop links
        try {
          const u = new URL(href, "https://blank2branded.co.za");
          u.searchParams.set("ref", `blog-${postId}`);
          a.setAttribute("href", u.pathname + u.search + u.hash);
        } catch {
          /* ignore */
        }
      }
    });
  }

  // 2. Walk children top-level, splitting around product embeds
  const parts: Part[] = [];
  let buf = "";
  const flush = () => {
    if (buf) {
      parts.push({ type: "html", html: buf });
      buf = "";
    }
  };

  const walk = (root: HTMLElement) => {
    for (const node of Array.from(root.childNodes)) {
      if (node.nodeType !== 1) {
        buf += (node as Text).data?.replace(/[<&>]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!)) ?? "";
        continue;
      }
      const el = node as HTMLElement;
      // Embedded product card
      if (el.hasAttribute("data-shopify-product")) {
        flush();
        const handle = el.getAttribute("data-shopify-product")!;
        if (handle) parts.push({ type: "product", handle });
        continue;
      }
      // Check if a descendant is a product embed (e.g. wrapped in <p>)
      const inner = el.querySelector?.("[data-shopify-product]") as HTMLElement | null;
      if (inner) {
        flush();
        // Render this block but stripping the embed, then add the card
        const clone = el.cloneNode(true) as HTMLElement;
        const innerClone = clone.querySelector("[data-shopify-product]");
        innerClone?.remove();
        if (clone.innerHTML.trim()) parts.push({ type: "html", html: clone.outerHTML });
        const handle = inner.getAttribute("data-shopify-product")!;
        if (handle) parts.push({ type: "product", handle });
        continue;
      }
      buf += el.outerHTML;
    }
  };

  walk(container);
  flush();
  return parts;
}
