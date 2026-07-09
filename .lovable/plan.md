
# BOFU Ranker — MeetEdward-style Page 1 Engine

A new admin section that automates bottom-of-funnel (BOFU) content targeting high-intent, low-competition keywords for fast Page 1 rankings in South Africa.

## The MeetEdward playbook (what we're copying)

1. **BOFU keyword targeting** — "best X", "X vs Y", "X alternatives", "X near me", "X price", "X for [use case]". Buyers ready to purchase, not researchers.
2. **Programmatic comparison pages** — one template, many pages: `blank2branded vs [competitor]`, `[product] vs [product]`, "best [category] in South Africa".
3. **Purpose-built URL structures** — `/vs/{competitor}`, `/best/{category}`, `/alternatives/{brand}` — clean, keyword-rich slugs that match search intent verbatim.
4. **Short-form video embeds** — YouTube Shorts / TikTok / Reels embedded high on the page to grab video-carousel and blended-SERP real estate.
5. **Volume + speed** — dozens of narrow pages instead of a few broad ones. Each ships with schema, FAQ, and internal links auto-wired.

## New admin section: **BOFU Ranker** (sidebar entry under SEO)

Five tabs:

### 1. Keyword Discovery
- Input: seed keyword or category (e.g. "custom t-shirts", "DTF prints")
- Uses Semrush + Lovable AI to return BOFU intent-classified queries:
  - Comparison (`X vs Y`)
  - Alternative (`alternatives to X`)
  - Best-of (`best X in Johannesburg`)
  - Local (`X near me`, `X Cape Town`)
  - Price / cheap
- Each row shows: volume, KD (difficulty), intent tag, "Generate page" button
- Filter: KD < 30 + volume > 10 (the low-competition sweet spot)

### 2. Page Templates
Four built-in templates, each with its own URL prefix and JSON-LD:

| Template | URL pattern | Schema |
|---|---|---|
| Versus | `/vs/{slug}` | `ComparisonTable` + `FAQPage` |
| Alternatives | `/alternatives/{slug}` | `ItemList` + `FAQPage` |
| Best-of | `/best/{slug}` | `ItemList` + `Review` |
| Local | `/local/{city}/{slug}` | `LocalBusiness` + `FAQPage` |

Each template renders: H1 matching the query, video embed slot, comparison/list table, pros/cons, price block, FAQ, CTA to shop/quote.

### 3. Page Builder (AI)
- Pick a keyword + template → Lovable AI generates:
  - Title, meta, H1, intro
  - Comparison table rows (features, pricing, verdict)
  - 6-8 FAQ Q&As targeting People-Also-Ask
  - Internal link suggestions from existing shop/blog pages
- Video field: paste YouTube/TikTok/Reels URL, auto-detects embed type
- Preview + edit before publishing
- Publishes as a new route (baked into prerender at build time)

### 4. Video Hijack Library
- Table of embedded videos across all BOFU pages
- "Add video" flow: paste URL → auto-fetch title/thumbnail → assign to page(s)
- Tracks: which pages have video (video-carousel eligibility), which need one
- Supports YouTube Shorts, TikTok, Instagram Reels via oEmbed

### 5. Rankings Monitor
- Reuses existing GSC integration
- Shows BOFU pages only, sorted by:
  - Page 2 → Page 1 opportunity (positions 11-20)
  - Impressions gained in last 7/28 days
- "Refresh content" button → re-runs AI generator with latest SERP data

## Technical section

### DB migrations
```
bofu_pages (id, slug, template, keyword, title, meta_description,
            h1, intro, body_html, video_url, video_platform,
            faq_json, comparison_json, city, status, published_at,
            author_id, timestamps)
bofu_keywords (id, keyword, intent, volume, difficulty, source,
               status: new/queued/published/dismissed, page_id, timestamps)
```
Both: GRANT authenticated + service_role, RLS admin-only via `has_role`.

Public read policy on `bofu_pages` where `status='published'` so the static router can render them.

### Routes
- New dynamic routes in `src/lib/static-router.tsx`:
  - `/vs/:slug`, `/alternatives/:slug`, `/best/:slug`, `/local/:city/:slug`
- All render `src/routes/bofu.tsx` — one component picks template by URL prefix
- Prerender: `scripts/prerender-routes.ts` reads all `bofu_pages` with `status='published'` and bakes each into static HTML with full `<article>` body + JSON-LD + video embed (crawler-visible, same pattern as blog prerender)

### Edge functions
- `bofu-discover-keywords` — Semrush call + AI intent classification
- `bofu-generate-page` — Lovable AI (`google/gemini-3.5-flash`) writes comparison table + FAQ + copy from a template prompt
- `bofu-oembed` — fetches video oEmbed metadata (YouTube/TikTok/Instagram)

### Files
- `src/components/admin/bofu/BofuHub.tsx` (tabs shell)
- `src/components/admin/bofu/DiscoveryPanel.tsx`
- `src/components/admin/bofu/TemplatesPanel.tsx`
- `src/components/admin/bofu/PageBuilderPanel.tsx`
- `src/components/admin/bofu/VideoLibraryPanel.tsx`
- `src/components/admin/bofu/RankingsPanel.tsx`
- `src/routes/bofu.tsx` (public renderer)
- `src/lib/bofu-templates.ts` (template configs + JSON-LD builders)
- Sidebar entry added to `src/routes/admin.tsx`

### Reuses (no rebuild)
- Semrush tools (already connected)
- Lovable AI Gateway with existing `LOVABLE_API_KEY`
- GSC integration for rankings tab
- `computeSeoScore` for per-page grading
- Existing prerender pipeline

## Delivery order
1. Migrations (2 tables) + public read policy
2. Static router + `bofu.tsx` renderer + prerender integration
3. Page Builder + AI edge function (the core value)
4. Keyword Discovery + Semrush edge function
5. Video Library + oEmbed
6. Rankings Monitor (GSC filter view)

## Open questions before I build

1. **Competitors to seed the "vs" pages** — should I pull from Semrush organic competitors automatically, or do you want to hand-pick (e.g. Vicbay, Print Locker, Redberry, Blank Clothing)?
2. **Local city list** for `/local/{city}/*` pages — start with Johannesburg, Pretoria, Cape Town, Durban, Port Elizabeth? Or a bigger list?
3. **Auto-publish vs review** — should AI-generated pages publish straight to live (fast, MeetEdward-style volume) or land as drafts you approve first?
4. **Video sourcing** — will you record TikTok/Reels yourself and paste URLs, or should we also pull relevant existing YouTube Shorts by keyword?

Say **yes** to build in the order above, or answer the 4 questions and I'll adjust.
