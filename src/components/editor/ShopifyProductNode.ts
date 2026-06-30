import { Node, mergeAttributes } from "@tiptap/core";

/** Atom block node representing an embedded Shopify product card.
 *  Stored as: <div data-shopify-product="handle" class="shopify-product-embed">…</div>
 *  Rendered live by BlogContentRenderer on the frontend. */
export const ShopifyProductNode = Node.create({
  name: "shopifyProduct",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  defining: true,

  addAttributes() {
    return {
      handle: { default: "" },
      title: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-shopify-product]",
        getAttrs: (el) => ({
          handle: (el as HTMLElement).getAttribute("data-shopify-product") || "",
          title: (el as HTMLElement).getAttribute("data-title") || "",
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const handle = HTMLAttributes.handle || "";
    const title = HTMLAttributes.title || handle;
    return [
      "div",
      mergeAttributes(
        { "data-shopify-product": handle, "data-title": title, class: "shopify-product-embed" },
      ),
      `🛒 Product card: ${title || handle}`,
    ];
  },
});
