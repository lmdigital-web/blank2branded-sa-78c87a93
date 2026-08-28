-- Restore missing top-level shop categories.
-- IDs are generated automatically so we do not depend on old UUIDs.

INSERT INTO public.shop_categories (name, slug, position)
VALUES
  ('Gifting', 'gifting', 20),
  ('Bags', 'bags', 21),
  ('Homeware', 'homeware', 22),
  ('Work Wear', 'work-wear', 23),
  ('Sport', 'sport', 24),
  ('Head Wear', 'head-wear', 25),
  ('Display', 'display-cat', 26),
  ('Sublimation', 'sublimation-cat', 27),
  ('Chef Wear', 'chef-wear', 28)
ON CONFLICT (slug) DO NOTHING;