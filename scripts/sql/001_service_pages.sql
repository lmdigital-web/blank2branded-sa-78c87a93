-- Service pages — reusable long-form service landing pages at /services/:slug/
-- Rendered by src/components/ServicePageTemplate.tsx and prerendered by
-- scripts/prerender-routes.ts so crawlers see the full body + FAQPage schema.

create table if not exists public.service_pages (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  meta_description text,
  keyword          text,
  h1               text,
  intro            text,
  body_html        text,
  -- [{ title, description }]
  benefits_json    jsonb,
  -- [{ step, title, description }] — defaults to the standard 4-step process
  process_json     jsonb,
  -- [{ q, a }] — rendered as <details> and emitted as FAQPage JSON-LD
  faq_json         jsonb,
  -- [{ slug, title, description }] — other service pages
  related_json     jsonb,
  -- [{ slug, title }] — blog posts
  blog_json        jsonb,
  hero_image       text,
  status           text not null default 'draft',
  sort_order       integer not null default 0,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists service_pages_status_idx
  on public.service_pages (status);

alter table public.service_pages enable row level security;

-- Published service pages are public content; anything else stays behind auth.
create policy "published service pages are public"
  on public.service_pages
  for select
  using (status = 'published' or auth.role() = 'authenticated');