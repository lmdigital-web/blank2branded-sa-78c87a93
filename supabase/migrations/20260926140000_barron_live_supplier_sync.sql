-- Barron live supplier integration foundation.
-- Safe additive migration: does not alter existing catalogue rows or customer prices.
create table if not exists public.barron_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check (status in ('running','succeeded','failed','preview')),
  trigger_source text not null default 'manual',
  feed_row_count integer,
  distinct_item_count integer,
  matched_product_count integer,
  new_item_count integer,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.barron_supplier_feed_staging (
  id bigint generated always as identity primary key,
  sync_run_id uuid not null references public.barron_sync_runs(id) on delete cascade,
  supplier_stock_code text,
  supplier_stock_header_id text,
  supplier_stock_id text,
  description text,
  colour text,
  size text,
  category text,
  supplier_brand text,
  supplier_base_price numeric(12,2),
  supplier_discount_base_price numeric(12,2),
  qty_available integer,
  warehouse_bond integer,
  warehouse_bw integer,
  weight_per_unit numeric(12,4),
  image_url text,
  raw_record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists barron_staging_run_idx on public.barron_supplier_feed_staging(sync_run_id);
create index if not exists barron_staging_stock_code_idx on public.barron_supplier_feed_staging(supplier_stock_code);
create index if not exists barron_staging_header_idx on public.barron_supplier_feed_staging(supplier_stock_header_id);

-- Supplier cost is kept distinct from retail prices. 35% markup is applied after VAT:
-- supplier cost * 1.15 * 1.35 = supplier cost * 1.5525.
alter table public.shop_products
  add column if not exists supplier_cost numeric(12,2),
  add column if not exists supplier_vat_rate numeric(5,4) not null default 0.15,
  add column if not exists supplier_markup_rate numeric(5,4) not null default 0.35,
  add column if not exists supplier_stock_header_id text,
  add column if not exists supplier_sync_updated_at timestamptz;

alter table public.shop_product_variants
  add column if not exists supplier_cost numeric(12,2),
  add column if not exists supplier_stock_id text,
  add column if not exists supplier_stock_code text,
  add column if not exists supplier_qty_available integer,
  add column if not exists supplier_sync_updated_at timestamptz;

create unique index if not exists shop_products_barron_stock_header_unique
  on public.shop_products(supplier_stock_header_id)
  where supplier_stock_header_id is not null;

create unique index if not exists shop_product_variants_barron_stock_id_unique
  on public.shop_product_variants(supplier_stock_id)
  where supplier_stock_id is not null;

alter table public.barron_sync_runs enable row level security;
alter table public.barron_supplier_feed_staging enable row level security;

-- No client-facing policies: only service-role Edge Functions can access these tables.
