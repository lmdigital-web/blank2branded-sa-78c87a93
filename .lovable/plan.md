# Plan: Move from Shopify Checkout → WhatsApp Shop

## Goal
Keep a browsable product catalogue on the site, but route every order request into WhatsApp (`+27 69 838 4045`) instead of going through Shopify checkout. No credit-card processing on the site — quoting, payment and fulfilment happen over chat.

## Options (pick one)

### Option A — WhatsApp Catalog (native, recommended)
Use **WhatsApp Business Catalog** inside the WhatsApp Business app.
- Products, images, prices live inside WhatsApp itself.
- Customers browse the catalogue in-chat, tap "Message business" and their cart is pre-filled as a message.
- No site-side inventory needed. Site just links to `https://wa.me/27698384045` and to the catalog URL (`https://wa.me/c/27698384045`).
- Free. Managed from your phone / Meta Business Suite.
- Downside: catalog only visible after they open WhatsApp — weaker for SEO/discovery.

### Option B — Site catalogue + WhatsApp "Enquire / Order" button (recommended for us)
Keep our current shop UI (grid, product pages, categories) but:
- Remove Add to Cart / Shopify checkout.
- Each product page has a **"Order on WhatsApp"** button that opens WhatsApp with a pre-filled message including product name, selected variant, quantity, and a link back to the product page.
- Optional lightweight "cart" that just collects items client-side (localStorage) and, on "Send order", opens WhatsApp with the full list.
- Products stored in **Supabase** (our own DB), managed from the existing admin panel — no Shopify dependency.

### Option C — Hybrid
Keep Shopify as the product data source (nice admin, inventory) but disable checkout and use only the WhatsApp button flow above.
- Fastest to ship because catalogue code already exists.
- Still tied to Shopify billing.

## Recommendation
**Option B**, with a short **Option C transitional phase** so we can turn Shopify off cleanly:
1. Ship Option C first (button change only, keep Shopify reading).
2. Migrate product data into Supabase.
3. Cut Shopify off and disconnect.

## Implementation plan

### Phase 1 — Swap checkout for WhatsApp (Option C, ~half day)
- Add `src/lib/whatsapp.ts` helper: `buildOrderMessage(items)` + `openWhatsApp(msg)`.
- Replace CTAs on:
  - `src/routes/products.$handle.tsx` — "Order on WhatsApp" instead of Add to Cart.
  - `src/routes/shop.tsx` product cards — same.
  - `src/components/CartDrawer.tsx` — "Send order on WhatsApp" instead of Shopify checkout; keep line-item list; drop Shopify cart sync.
  - `src/components/blog/ShopifyProductCard.tsx` — "Enquire on WhatsApp".
- Remove Shopify checkout code paths from `src/stores/cartStore.ts` (keep local items array, drop `cartId`, `checkoutUrl`, sync).
- Delete `src/hooks/useCartSync.ts` usage.
- Keep product **reads** from Shopify Storefront API for now.

### Phase 2 — Own the product data (~1 day)
- New Supabase tables: `products`, `product_variants`, `product_images`, `collections`.
- Admin CRUD screen under `/admin` (reuse existing patterns).
- One-off import script that pulls current Shopify products into Supabase.
- Repoint `src/routes/shop.tsx` and `products.$handle.tsx` to Supabase.

### Phase 3 — Turn off Shopify (~1 hour)
- Delete `src/lib/shopify.ts`, `shopify-catalog.ts`, `ShopifyProductPicker`, `ShopifyProductNode`, `ShopifySyncPanel`, `shopify-order-webhook` edge function.
- Remove Shopify from admin nav / blog editor toolbar.
- Call `shopify--disconnect_store`.

### Phase 4 — Optional WhatsApp Catalog mirror
- Set up WhatsApp Business Catalog on the phone that owns +27 69 838 4045.
- Link `wa.me/c/…` from the footer + shop page so mobile users get the native experience too.

## Message format example
```
Hi Blank2Branded, I'd like to order:

• Platinum T-Shirt — Black / L × 5
• DTF Print A4 × 10

Link: https://blank2branded.co.za/products/platinum-t-shirt

Please send a quote.
```

## Things to decide before I build
1. Go straight to Option B (own DB) or take the Option C shortcut first?
2. Keep the multi-item "cart" concept, or just a single-product "Order on WhatsApp" per page?
3. Also enable native WhatsApp Catalog (Phase 4)?
4. Do we want the message to include price totals, or just items + quantities (let you quote back)?

Answer those and I'll start on Phase 1.
