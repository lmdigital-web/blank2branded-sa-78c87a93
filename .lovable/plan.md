# Shopify Revenue & Content Sync

A new admin section under `/admin` (sidebar item: **Shopify Sync**) with three panels, matching the existing card/table styling used by the Blog and Indexing panels.

## 1. Database (migration)

New tables (all in `public`, with RLS + GRANTs):

- `blog_clicks` — `id, post_id (fk posts), product_handle, product_id, ref_code, session_id, clicked_at`
  - Insert: anon + authenticated (public, so blog readers can log).
  - Select: admins only (via `has_role`).
- `blog_conversions` — `id, post_id, shopify_order_id (unique), order_number, ref_code, total_amount, currency, customer_email, line_items jsonb, ordered_at`
  - Insert: service_role only (webhook).
  - Select: admins only.
- `blog_link_issues` — `id, post_id, url, status_code, issue_type ('404'|'deleted_product'|'redirect'|'unreachable'), suggested_handle, resolved_at, last_checked_at`
  - Full CRUD: admins.

## 2. Click tracking

- Add `/r/blog/:postId/:productHandle` redirect route in `static-router` that:
  1. Inserts a `blog_clicks` row (fire-and-forget).
  2. Redirects to `/products/:handle?ref=blog-{postId}`.
- Rewrite outbound shop links rendered inside `blog.$slug.tsx` to flow through this redirect (DOM walk on render). External Shopify-domain links also rewritten.
- `products.$handle.tsx` reads `?ref=blog-...` and stores it on the cart store as `attribution.ref` so it flows into checkout (via `cartAttributes`/`note`).

## 3. Conversion ingestion (Shopify webhook)

New edge function `shopify-order-webhook`:
- Verifies HMAC with `SHOPIFY_WEBHOOK_SECRET` (request via `add_secret`).
- Parses `orders/create` payload, extracts `note_attributes` / `landing_site` for `ref=blog-<postId>`, upserts a `blog_conversions` row.
- User registers the webhook in Shopify admin (URL surfaced in the dashboard with a copy button).

## 4. Revenue Attribution Dashboard

New `src/components/admin/RevenuePanel.tsx`:
- Table columns: Blog Title · Views · Clicks · Conversions · Revenue (ZAR) · CVR%.
- Data: joins `posts` + aggregated `post_views`, `blog_clicks`, `blog_conversions`.
- Range selector (7d / 30d / all) matching existing styling.
- Top KPI cards: Total attributed revenue, Total conversions, Avg revenue/post.

## 5. Dynamic Product Inserter

- New `src/lib/shopify-admin.ts` — fetches catalog via existing Storefront API (`products` query with inventory `availableForSale` + image + price). Cached in-memory for 5 min.
- New TipTap node `ShopifyProductCard` (`src/components/editor/ShopifyProductCardNode.tsx`) storing only `{ handle }`. Render:
  - Fetches latest product on mount (live price/inventory).
  - Shows image, title, price, **Out of Stock** badge when `!availableForSale`.
  - On frontend (blog post), if product missing → renders nothing (graceful).
- Toolbar button in `RichTextEditor.tsx`: opens `ShopifyProductPicker` dialog with search input + paginated grid (thumbnail, title, price, stock badge). Select → inserts node.
- Renderer used in `blog.$slug.tsx` so cards display on the live blog.

## 6. Broken Link & 404 Monitor

- New edge function `scan-blog-links`:
  - Loads all published posts, extracts `<a href>` pointing to our Shopify storefront domain or `/products/`, `/collections/`.
  - For each unique URL: HEAD request via Storefront API (`productByHandle` / `collectionByHandle`) — handle missing = `deleted_product`; otherwise HTTP HEAD to detect 404.
  - Upserts results into `blog_link_issues`.
- Admin panel `BrokenLinksPanel.tsx`:
  - **SEO Health Alerts** card at top of Shopify Sync section with count.
  - Table: Post · Broken URL · Issue · Replacement (searchable product dropdown) · **Fix Link** button.
  - Fix action calls a `fix-blog-link` edge function that loads the post HTML, replaces the URL (string replace, scoped to that post), saves, marks `resolved_at`. Toast on success.
- "Rescan now" button triggers the function; last scan time shown.

## 7. Admin shell updates

`src/routes/admin.tsx`:
- Adds nav item **Shopify Sync** (icon `ShoppingBag`) with three internal tabs: Revenue · Product Inserter Help · Link Health.
- SEO Health Alerts widget rendered at top of any Shopify Sync tab when issues exist.

## Technical notes

- Reuses existing `SHOPIFY_STOREFRONT_TOKEN` for catalog reads (no Admin API needed for product listing — Storefront `products` returns inventory via `availableForSale`).
- Order webhook is the only Admin-side surface and uses HMAC, not Admin API calls.
- All new tables follow the project's GRANT + RLS pattern; `has_role(auth.uid(),'admin')` for admin reads.
- New secret needed: `SHOPIFY_WEBHOOK_SECRET` (requested via add_secret after plan approval).
- Styling reuses `Card`, table classes, range pill group, and tab pill group already in `admin.tsx`.

## Out of scope

- Multi-currency conversion (we store currency as-returned).
- Historical backfill of orders prior to webhook setup (one-time CSV import can be added later).
- Editing blog HTML beyond URL replacement in the link-fix flow.
