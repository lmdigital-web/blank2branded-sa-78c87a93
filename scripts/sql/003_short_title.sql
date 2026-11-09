alter table public.service_pages add column if not exists short_title text;

update public.service_pages set short_title = v.short_title from (values
  ('corporate-branded-apparel',     'Corporate Branded Apparel'),
  ('custom-uniforms-and-workwear',  'Custom Uniforms & Workwear'),
  ('branded-promotional-gifts',     'Branded Promotional Gifts')
) as v(slug, short_title)
where service_pages.slug = v.slug and service_pages.short_title is null;
