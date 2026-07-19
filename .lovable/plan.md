# Ranking Plan: "sublimated sports kits" (South Africa)

## What Semrush tells us

Data pulled from the ZA database:

- **"sublimated sports kits"** — no measurable monthly volume, KD not scored. It's a **long-tail, low-competition** term. Good news: easy to rank. Bad news: on its own it won't drive much traffic.
- Related terms with actual (small) volume and KD 0/100 (very easy):
  - sublimated jerseys — 20/mo
  - custom sports kits — 20/mo
  - sublimation printing south africa — 20/mo
  - sublimated rugby jerseys — 20/mo
  - sublimated netball dresses — 20/mo
- **blank2branded.co.za** currently ranks pos 69 for "sublimated golf shirts" (390/mo) and pos 72 for "dye sublimation shirts" (140/mo) — both from the existing `/sublimation` page. Authority Score is low, so we're building from the ground up.

**Takeaway:** don't chase the single phrase — build a **topic cluster** where "sublimated sports kits" is the hub. The cluster catches the wider "sublimated jerseys / rugby / soccer / netball / hockey kits" searches (each low volume but they add up), and internal links push authority to the hub page.

## The strategy — hub & spoke

```text
                    /sports-kits  (HUB — "sublimated sports kits")
                          │
      ┌──────────────┬────┴────┬──────────────┬──────────────┐
      ▼              ▼         ▼              ▼              ▼
 /blog/rugby   /blog/soccer  /blog/netball  /blog/hockey  /blog/cricket
  -kits         -kits         -dresses      -kits         -kits
      │              │         │              │              │
      └──────────────┴─── all link back to hub + cross-link ─┘

  BOFU pages (already have the engine):
   /vs/blank2branded-vs-<competitor>    (kit suppliers)
   /best/sublimated-sports-kits-south-africa
   /local/johannesburg/sublimated-sports-kits
   /local/cape-town/sublimated-sports-kits
```

## Delivery — 6 steps

### 1. Build the hub page: `/sports-kits`
A dedicated landing page (not a blog post). Structure:
- **H1:** Sublimated Sports Kits South Africa
- Hero + "Request a Quote" CTA + WhatsApp
- Sport tiles: Rugby, Soccer, Netball, Hockey, Cricket, Basketball, Cycling, Athletics (each links to its spoke page)
- "How sublimation works" section (short, with photo)
- Turnaround / MOQ / pricing tier table
- Gallery of past kits
- FAQ (6–8 Qs targeting People-Also-Ask)
- Testimonials + trust badges
- Full JSON-LD: `Product` + `LocalBusiness` + `FAQPage`

### 2. Write 5 spoke blog posts (use the existing AI generator)
One per sport, each 800–1200 words, each linking back to `/sports-kits`:
- Sublimated Rugby Jerseys South Africa — Sizing, Pricing & Turnaround
- Custom Soccer Kits — Team Colours, Numbering, Delivery
- Netball Dresses — Fabric, Fit & Bulk Order Guide
- Field Hockey Kits — What to Order for Your Club
- Cricket Playing Shirts — Sublimation vs Screen Print

### 3. Generate 4 BOFU pages (using the BOFU Ranker you already built)
- `/vs/blank2branded-vs-<top competitor>` — pick one sublimation kit supplier
- `/best/sublimated-sports-kits-south-africa`
- `/local/johannesburg/sublimated-sports-kits`
- `/local/cape-town/sublimated-sports-kits`

### 4. Wire internal links
- Homepage → hub (add "Sports Kits" to main nav)
- `/sublimation` page → hub (contextual link)
- `/shop` → hub (banner for team orders)
- Each spoke ↔ hub ↔ other spokes (footer or "related" block)

### 5. Meta, schema, sitemap
- Title: **Sublimated Sports Kits South Africa | Custom Team Kits | Blank2Branded** (<60 chars)
- Meta: focused on "custom sublimated kits, delivered nationwide, low MOQ"
- Add hub + spokes to `scripts/generate-sitemap.ts` and re-submit sitemap to GSC + Bing
- Prerender the hub (`scripts/prerender-routes.ts`) so crawlers see full HTML

### 6. Off-page (do outside the app)
- Google Business Profile: add "Sublimated Sports Kits" as a service + photos
- List on 3–5 SA business directories (Yellow Pages ZA, Brabys, Hotfrog)
- Get 2–3 sports clubs you've supplied to link back from their sites ("kit supplied by Blank2Branded")

## What I'll build now (if you approve)

Steps 1–5 are all in-app work I can ship in this project:

- New route `src/routes/sports-kits.tsx` (hub page) + add to router + sitemap + prerender
- Add "Sports Kits" link to `src/components/Header.tsx`
- Generate 5 blog drafts via the SEO AI generator (you review/publish from admin)
- Generate 4 BOFU pages via the BOFU Ranker (you review/publish from admin)
- Internal-link block on `/sublimation` and homepage pointing to `/sports-kits`

Step 6 is manual (GBP + directories + club backlinks) — I'll give you a copy-paste checklist.

## Realistic timeline

- Week 1: hub live + spokes drafted
- Week 2–3: BOFU pages live, sitemap re-submitted, GBP updated
- Week 4–8: Google indexes + starts ranking (KD is 0 so first-page appearance for exact match is realistic once indexed)
- Week 8–12: hub climbs for broader terms as spokes accumulate authority

## Confirm before I build

1. Which **top competitor** should the `/vs/` page target? (e.g. Balls Sports Wear, KGB Sportswear, Sondela — or another you compete with)
2. Two cities for the `/local/` pages — Johannesburg + Cape Town, or different?
3. Do you want the hub in the **main nav** (replacing/adding to Blanks/DTF/Sublimation) or only in the footer + `/sublimation` cross-links?

Say **go** with answers to 1–3 and I'll ship steps 1–5.
