# Ads Manager — Admin Module

A complete in-admin toolkit to launch, track, and optimize paid campaigns across Meta (Facebook/Instagram), TikTok, Google, Pinterest, and Microsoft (Bing) Ads. Focus is on what Lovable can actually deliver: pixel/tag installation, campaign records, UTM link builder, and unified conversion tracking. Ad creation on the networks themselves still happens in their ad managers (their APIs require OAuth apps and business verification), but this hub gives you every asset you need to run winning campaigns.

## New admin sidebar item: "Ads"

Sub-tabs:
1. **Dashboard** — snapshot of active campaigns, spend logged, conversions, revenue from ads (via UTM attribution against `orders` + `blog_conversions`).
2. **Pixels & Tags** — install/manage tracking snippets per network.
3. **Campaigns** — CRUD for campaigns: network, name, objective, budget, dates, status, notes, creative links.
4. **UTM Builder** — generate tagged URLs for any page (auto-fills utm_source/medium/campaign/content/term), copy-to-clipboard, saved links list.
5. **Conversions** — event log (page view, add-to-cart, checkout, purchase) with per-network breakdown and ROAS.
6. **Audiences & Creatives** — checklist/library: upload creative refs (image URLs), audience notes, ready-to-paste ad copy.

## Pixels supported (with server-side + client-side)

Each pixel takes an ID + optional access token (for server-side/Conversions API):

- **Meta Pixel** (`FB_PIXEL_ID`, `FB_CAPI_TOKEN`) — client fbq + server Conversions API
- **TikTok Pixel** (`TIKTOK_PIXEL_ID`, `TIKTOK_EVENTS_TOKEN`) — client ttq + server Events API
- **Google Ads / GA4** (`GOOGLE_ADS_ID`, `GOOGLE_CONVERSION_LABEL`, `GA4_MEASUREMENT_ID`) — gtag.js
- **Pinterest Tag** (`PINTEREST_TAG_ID`) — pintrk
- **Microsoft/Bing UET** (`BING_UET_ID`) — uetq

Pixel IDs stored in `app_settings` (public — pixel IDs are public by design). Server access tokens stored via `add_secret`.

## Data model (new tables)

```text
ad_campaigns          id, network, name, objective, status, budget_cents,
                      start_date, end_date, utm_campaign, notes, creative_url,
                      target_url, ad_copy, external_id, created_at, updated_at

ad_pixels             id, network (unique), pixel_id, extra (jsonb), enabled,
                      updated_at
                      -- server tokens live in secrets, not this table

ad_events             id, network, event_type (page_view|view_content|
                      add_to_cart|initiate_checkout|purchase|lead),
                      value_cents, currency, order_id, utm_source, utm_medium,
                      utm_campaign, utm_content, utm_term, url, user_agent,
                      created_at

ad_utm_links          id, name, target_url, utm_source, utm_medium,
                      utm_campaign, utm_content, utm_term, full_url,
                      campaign_id (fk), clicks, created_at
```

All admin-only via `has_role(auth.uid(), 'admin')`. `ad_events` insert allowed for `anon` so client tracker can log events; select admin-only. Full `GRANT` blocks included per project rules.

## Runtime integration

- **`src/lib/ads/pixels.ts`** — loads enabled pixels from `app_settings` once, injects each network's snippet, exposes `trackEvent(name, params)` that fans out to every enabled network with the right event name mapping (e.g. purchase → fbq `Purchase`, ttq `CompletePayment`, gtag `conversion`, pintrk `checkout`, uetq `purchase`).
- **`src/hooks/useAdTracking.ts`** — hooks into route changes for `PageView`, and existing cart/checkout events fire `add_to_cart` / `initiate_checkout`. Shopify checkout completion is tracked via a `purchase` beacon on the return URL (Shopify's own thank-you page is off-domain, so we also document the manual pixel install inside Shopify checkout settings).
- **UTM auto-capture** — on landing, capture `utm_*` params to `sessionStorage` so purchase events attribute correctly.
- **Edge function `ads-server-event`** — receives purchase events, forwards to Meta CAPI + TikTok Events API server-side for iOS/ad-blocker resilience. Uses stored access tokens.

## Admin UI files

```text
src/routes/admin.tsx                              add "Ads" nav item
src/components/admin/ads/AdsHub.tsx               tabbed shell
src/components/admin/ads/DashboardPanel.tsx
src/components/admin/ads/PixelsPanel.tsx
src/components/admin/ads/CampaignsPanel.tsx
src/components/admin/ads/UtmBuilderPanel.tsx
src/components/admin/ads/ConversionsPanel.tsx
src/components/admin/ads/CreativesPanel.tsx
```

## What Lovable cannot do (called out in-app)

- Push campaigns to the networks (needs each network's OAuth app + verification). The Campaigns tab is a source-of-truth log and has "Open in [Network] Ads Manager" deep links.
- Fetch spend/impressions from networks without those OAuth apps. The Dashboard shows **your** conversion-side data (revenue attributed by UTM) and lets you manually log spend per campaign to compute ROAS.

## Rollout

1. Migration: new tables + `app_settings` rows for pixel IDs, with GRANTs + RLS.
2. Pixel loader + tracker wired globally in `App.tsx`.
3. Admin Ads hub with all six sub-panels.
4. Edge function `ads-server-event` for server-side Meta/TikTok events.
5. Docs strip in Pixels panel showing exactly where to paste the Shopify checkout pixels (one-time manual step per network).

After this ships, you'll paste pixel IDs into the Pixels tab, generate UTM links for each ad, and the Conversions/Dashboard tabs will populate as traffic and orders come in.
