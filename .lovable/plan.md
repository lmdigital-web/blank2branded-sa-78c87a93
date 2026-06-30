# Advanced Page 1 Ranking Features

Four interlocking modules added to the existing admin dashboard. All work alongside current GSC, Indexing, Speed, and Shopify Sync tabs.

---

## 1. Automatic JSON-LD Schema Engine

**Goal:** every public page ships valid, dynamic schema in the `<head>` without manual authoring.

- Add `src/lib/schema-builder.ts` with builders for `Article`, `Organization`, `Product`, `BreadcrumbList`, `WebSite`.
- Inject via `react-helmet-async` (already in project) on:
  - `routes/blog.$slug.tsx` → `Article` + `BreadcrumbList` (uses post title, cover image, published_at, modified_at, author profile, focus keyword).
  - `routes/products.$handle.tsx` → `Product` + `BreadcrumbList` (pulls live Shopify price, currency ZAR, availability from variant `availableForSale`, images, SKU, brand).
  - `routes/shop.tsx`, `display.tsx`, etc. → `BreadcrumbList`.
  - Sitewide `Organization` + `WebSite` stays in `index.html` (already there).
- Admin: new **Schema** sub-tab under SEO showing a small validator that fetches a URL and reports which schema types were detected (uses existing `fetch`-based scan pattern).

## 2. GSC Content Decay Monitor

**Goal:** spot pages losing traction before they fall off page 1.

- New edge function `gsc-decay` that queries Search Console for two windows (last 30d vs prior 30d), top 50 URLs by current clicks, computes click + impression delta %.
- New admin widget `src/components/admin/DecayPanel.tsx` titled **"Rankings at Risk (Content Decay)"** showing rows: URL, clicks Δ%, impressions Δ%, avg position change, **Optimize & Update** button that routes to the matching post editor (resolved by slug from URL path; Shopify products link to Shopify admin).
- Pinned to the main Blog feed view and also available as its own tab card.

## 3. Instant Google Indexing API Integration

**Goal:** every publish/update fires an immediate indexing request.

- The existing `notify-search-engines` function already pings sitemaps + IndexNow. Extend with **Google Indexing API** (`URL_UPDATED` / `URL_DELETED`) using a service account JWT.
- New secret: `GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON` (full service account key JSON). User must:
  1. Create service account in Google Cloud, download JSON key.
  2. Add it as Owner on the Search Console property.
  3. Enable Indexing API.
  Agent will then store the JSON via add_secret.
- Auto-fire triggers:
  - Blog publish / scheduled-promote / update → call function.
  - Shopify product webhook (future) or manual "Resync" button in Shopify Sync tab.
- UI: badge **"Index Request Sent"** (green) / **"Pending"** (amber) / **"Failed"** (red) next to each post in admin lists, read from `seo_submissions.status` filtered by `provider='google_indexing'`.

## 4. E-E-A-T Quality Gate

**Goal:** enforce author authority + originality before publish.

- New table `public.authors` (name, slug, bio, credentials, avatar_url, email, website, social JSON, expertise tags).
- Extend `public.posts`:
  - `author_id uuid references public.authors`
  - `experience_notes text` (Information Gain / First-Hand Experience)
- Admin **Authors** sub-tab under Blog → CRUD form.
- Post editor changes:
  - **Author** dropdown (required; loads from `authors` table).
  - **Information Gain / First-Hand Experience Notes** textarea (required min 80 chars to mark `published` or `scheduled`; saved as draft without it).
  - SEO score gains 2 new checks (+5 pts each): has author with credentials, has experience notes ≥ 80 chars.
- Public blog page renders author byline + JSON-LD `author` field from the linked profile (feeds module 1).

---

## Technical details

**New / changed files**
- `src/lib/schema-builder.ts` (new)
- `src/routes/blog.$slug.tsx`, `products.$handle.tsx` — add Helmet schema
- `src/components/admin/DecayPanel.tsx` (new)
- `src/components/admin/AuthorsPanel.tsx` (new)
- `src/components/admin/SchemaValidator.tsx` (new)
- `src/routes/admin.tsx` — register Decay widget + Authors tab + indexing badges
- `src/routes/admin.post-editor.tsx` — author dropdown, experience notes, gated publish
- `src/lib/seo-score.ts` — +2 E-E-A-T checks
- `supabase/functions/gsc-decay/index.ts` (new)
- `supabase/functions/notify-search-engines/index.ts` — add Google Indexing API call

**Migrations**
- `authors` table + grants + RLS (admin write, public read)
- `posts.author_id`, `posts.experience_notes`

**Secrets to request**
- `GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON` (after user creates the service account)

**Order of execution**
1. Migrations (authors + post columns)
2. Schema builder + Helmet wiring
3. Authors panel + post editor gate + SEO score updates
4. Decay edge function + panel
5. Notify-search-engines extension (waits on user secret; module ships, badge shows "Setup required" until secret added)

Tell me to proceed and I'll start with the migration.