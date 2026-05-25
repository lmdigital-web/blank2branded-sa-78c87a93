
create table public.post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  referrer text,
  country text
);

create index post_views_post_id_idx on public.post_views(post_id);
create index post_views_viewed_at_idx on public.post_views(viewed_at desc);

alter table public.post_views enable row level security;

create policy "Anyone can record a view"
on public.post_views for insert
to anon, authenticated
with check (true);

create policy "Admins can read views"
on public.post_views for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

alter table public.posts add column if not exists keywords text;
