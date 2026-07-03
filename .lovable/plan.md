# SEO Admin Hub — Consolidation & Expansion Plan

## Goal
Group all SEO tooling under a single **SEO** entry in the admin sidebar with 6 sub-tabs. Reuse what already exists, build only what's missing, and match the existing admin design system (cards, tables, tabs).

## What's already built (reuse — do not rebuild)

| Existing panel | Fits into new sub-tab |
|---|---|
| `SearchConsolePanel` | Analytics Snapshot |
| `IndexingPanel` | Health Audit (indexing status) |
| `OpportunitiesPanel` | Content Ideas & Keywords |
| `DecayPanel` | Analytics Snapshot |
| `SpeedPanel` | Health Audit |
| `BrokenLinksPanel` | Health Audit |
| `AuthorsPanel` | stays separate (E-E-A-T) |
| `SocialIntegrationsPanel` | stays separate |
| `lib/seo-score.ts` (Yoast scoring) | Health Audit + Meta Editor |
| `RichTextEditor` + `AiImageDialog` | AI Content Generator |
| `generate-blog-image` edge function | AI Content Generator |

## New SEO section — sub-tabs

Sidebar collapses **Google Search, Indexing, Opportunities, Speed, Rankings at Risk** into a single **SEO** parent with these sub-tabs:

### 1. Health Audit *(new wrapper + reuses existing)*
- Aggregates every post + every static/product route
- Per-page checks: meta title present & unique, meta description length, H1 count, images missing alt, internal broken links, schema markup present, canonical present
- Column: SEO score 0–100 (extends `computeSeoScore`)
- Sorted worst-first, "Fix" button jumps to the meta editor
- Embeds `IndexingPanel`, `SpeedPanel`, `BrokenLinksPanel` in accordions below the table

### 2. Meta Tag Editor *(new)*
- Single table listing every post + every static route (`/`, `/shop`, `/blog`, `/dtf`, `/blanks`, `/about`, `/contact`, product pages)
- Inline-edit: title, meta description, canonical, OG image URL
- Live counters — red if title >60 / desc >160
- Posts save to `posts` table (already exists)
- Static routes save to a new `route_meta` table (slug, title, description, canonical, og_image)
- Prerender script (`scripts/prerender-routes.ts`) reads `route_meta` at build time to inject per-route tags

### 3. Keywords & Ideas *(new)*
- New table `seo_keywords` (keyword, target_url, status: idea/drafting/published, notes, priority)
- CRUD form + table
- "Create draft post" button pre-fills the AI generator with the keyword
- Existing `OpportunitiesPanel` embedded above as GSC-sourced suggestions

### 4. AI Content Generator *(new)*
- Form: topic, focus keyword, tone, target word count, target internal links (autocomplete from existing pages/posts)
- Uses Lovable AI Gateway with `google/gemini-3-flash-preview` (NOT Anthropic — Lovable AI Gateway is the platform default and costs less; user was originally asking for Claude but we already have LOVABLE_API_KEY provisioned)
- Returns: H1 title, meta description, article body (HTML with H2/H3), suggested slug
- Editable preview → "Save as draft" writes to `posts` with status=draft
- New edge function `generate-blog-draft`

### 5. Internal Linking Helper *(new)*
- Sidebar addition inside the post editor (`admin.post-editor.tsx`)
- On the SEO Hub, standalone view: pick a post → list other posts/pages ranked by keyword overlap (Jaccard on keywords + title tokens)
- Click a suggestion → copies anchor HTML to clipboard

### 6. Analytics Snapshot *(reuses existing)*
- Renders `SearchConsolePanel` (clicks, impressions, avg position — already live)
- Renders `DecayPanel` below

## Technical section

### DB migrations
```
route_meta (slug PK, title, description, canonical, og_image, updated_at)
seo_keywords (id, keyword, target_url, status, notes, priority, created_by, timestamps)
```
Both: GRANT to authenticated + service_role, RLS restricted to admins via `has_role`.

### File changes
- `src/routes/admin.tsx` — collapse SEO subsections into one `section = "seo"` with internal sub-tab state; remove old top-level entries (search/indexing/opportunities/speed/decay)
- `src/components/admin/seo/HealthAuditPanel.tsx` (new)
- `src/components/admin/seo/MetaEditorPanel.tsx` (new)
- `src/components/admin/seo/KeywordsPanel.tsx` (new)
- `src/components/admin/seo/AiGeneratorPanel.tsx` (new)
- `src/components/admin/seo/InternalLinksPanel.tsx` (new)
- `src/components/admin/seo/AnalyticsPanel.tsx` (new — thin wrapper)
- `src/lib/seo-audit.ts` (new — page-crawl checks)
- `supabase/functions/generate-blog-draft/index.ts` (new)
- `scripts/prerender-routes.ts` — read `route_meta` overrides
- 1 migration for the two new tables

### Deferred / clarifications
- **Claude vs Lovable AI**: I'll use Lovable AI Gateway (Gemini 3 Flash) unless you specifically want to pay for Anthropic — it's free within your workspace allowance.
- **Bulk edit**: v1 will do inline edit per row; a bulk "apply template" modal can come after you've used it a week.
- **GSC card stub**: not needed — SearchConsolePanel is already wired to live data.

## Delivery order
1. Migration (2 tables)
2. Consolidate sidebar + shell for `section = "seo"` with sub-tabs (existing panels moved, no behaviour change)
3. Meta Editor + prerender integration
4. Health Audit
5. Keywords
6. AI Generator (+ edge function)
7. Internal Links helper

Shall I proceed with this? Say **yes** to build all 7 steps in order, or tell me which sub-tabs to drop/reorder.
