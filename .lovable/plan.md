# Phase 2 — Move the catalogue to Supabase + Admin CRUD

Storefront starts reading products/categories from Supabase instead of Shopify. WhatsApp checkout from Phase 1 keeps working. An admin **Catalogue** section lets you add and manage categories, products, variants and images. Shopify code stays in place for now (removed in Phase 3).

## What already exists

Supabase already has the tables from an earlier build — we'll reuse them, not recreate:

- `shop_categories` — `name`, `slug`, `parent_id`, `position` (RLS: public read, admin write).
- `shop_products` — `title`, `handle`, `description`, `status` (draft/published), `base_price`, `category_id`, `meta_title`, `meta_description`, `position` (RLS: public reads published only).
- `shop_product_variants` — 3 option pairs, `price`, `sku`, `available`, `position`.
- `shop_product_images` — `url`, `alt`, `position`.

## Backend changes

- Flip storage bucket `product-images` to **public** so image URLs render without signed tokens, and add upload/update/delete policies for admins.
- Small migration for a slug-uniqueness helper and a compound index (`status`, `position`) so the shop page paginates cheaply.

## New shared code

- `src/lib/catalog.ts` — Supabase-backed catalogue client with the shape the rest of the app already expects:
  - `listPublishedProducts()` → array shaped like `ShopifyProduct` (so `shop.tsx`, `products.$handle.tsx`, and the WhatsApp cart keep working with zero prop churn).
  - `listCategoryTree()` → grouped categories for the sidebar.
  - `getProductByHandle(handle)` → single product + variants + images.
- `src/lib/upload-product-image.ts` — thin wrapper around `supabase.storage.from('product-images')`.

## Storefront swap

- `src/routes/shop.tsx` — replace the Shopify `products` + `collections` queries with `listPublishedProducts()` and `listCategoryTree()`. Category sidebar reads real `shop_categories` rows; "All products" and per-category counts still work.
- `src/routes/products.$handle.tsx` — read from `getProductByHandle`; variant picker, gallery, price display, MOQ upsell, and "Add to Cart" (→ WhatsApp drawer) stay exactly as they are.
- `src/components/blog/ShopifyProductCard.tsx` — resolves handle via Supabase; if a post references a product that no longer exists it renders nothing (already does that).
- Shopify Storefront API code (`src/lib/shopify.ts`, `src/lib/shopify-catalog.ts`) stays in the repo but is no longer imported by the storefront.

## Admin — Catalogue tab

New top-level tab in `src/routes/admin.tsx` (alongside Blog, SEO, Ads, BOFU, etc.), with two panels:

### Categories panel
- Tree view of categories (parent → children).
- Add / rename / delete / re-order (drag or up-down buttons).
- Parent picker to nest categories (e.g. Apparel → T-shirts, Hoodies).
- Slug auto-generated from name, editable, uniqueness enforced.

### Products panel
- Searchable, filterable product list (status, category).
- **Product editor** (drawer or `/admin/products/:id` route):
  - Basics: title, handle (auto from title, editable), category, status (draft/published), base price, description (plain textarea + light markdown, matches the rest of the site).
  - SEO: meta title, meta description with character counters.
  - Images: multi-upload to `product-images`, drag-to-reorder, delete, first image = primary.
  - Variants: table editor for option name/value pairs (Colour, Size, etc.), price, SKU, available toggle, position. Includes a **"Generate variants from options"** helper — enter Colour values (Red, Black) and Size values (S, M, L) and it produces the full grid at the base price for quick editing.
  - Save runs a transactional upsert (product + variants + image rows).
- Duplicate and delete actions from the list.

## Out of scope for this phase

- Migrating existing Shopify products into Supabase (we'll do that as a one-off import in Phase 3 once you're happy with the new admin).
- Removing Shopify code and running `disconnect_store` (Phase 3).
- Inventory tracking beyond the per-variant `available` toggle.

## Technical notes

- All writes go through Supabase RLS — admin-only, enforced by `has_role(auth.uid(),'admin')`.
- No new edge functions needed; everything is direct table access from the admin UI.
- The Supabase-shaped catalogue objects are adapted to the existing `ShopifyProduct` shape used by the cart, so `cartStore` and `CartDrawer` stay untouched.
