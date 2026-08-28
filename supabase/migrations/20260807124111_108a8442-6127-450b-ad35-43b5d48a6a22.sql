-- Create/find the Apparel parent category.
-- The previous migration used a hard-coded UUID that does not exist
-- in the restored database.

INSERT INTO public.shop_categories (name, slug, position)
VALUES ('Apparel', 'apparel', 0)
ON CONFLICT (slug) DO NOTHING;


-- Create subcategories under Apparel using the actual Apparel ID.
INSERT INTO public.shop_categories (name, slug, parent_id, position)
SELECT 'Jackets', 'apparel-jackets', id, 0
FROM public.shop_categories
WHERE slug = 'apparel'
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  position = EXCLUDED.position;


INSERT INTO public.shop_categories (name, slug, parent_id, position)
SELECT 'Golfers', 'apparel-golfers', id, 1
FROM public.shop_categories
WHERE slug = 'apparel'
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  position = EXCLUDED.position;


INSERT INTO public.shop_categories (name, slug, parent_id, position)
SELECT 'T-Shirts', 'apparel-t-shirts', id, 2
FROM public.shop_categories
WHERE slug = 'apparel'
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  position = EXCLUDED.position;


INSERT INTO public.shop_categories (name, slug, parent_id, position)
SELECT 'Hoodies & Sweaters', 'apparel-hoodies', id, 3
FROM public.shop_categories
WHERE slug = 'apparel'
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  position = EXCLUDED.position;


INSERT INTO public.shop_categories (name, slug, parent_id, position)
SELECT 'Shirts & Blouses', 'apparel-shirts', id, 4
FROM public.shop_categories
WHERE slug = 'apparel'
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  position = EXCLUDED.position;


INSERT INTO public.shop_categories (name, slug, parent_id, position)
SELECT 'Pants & Jeans', 'apparel-pants', id, 5
FROM public.shop_categories
WHERE slug = 'apparel'
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  position = EXCLUDED.position;


-- Reassign products based on keywords.
-- Only products currently assigned to the old Apparel UUID
-- are considered for reassignment.

UPDATE public.shop_products
SET category_id = (
  SELECT id
  FROM public.shop_categories
  WHERE slug = 'apparel-jackets'
)
WHERE category_id = 'de57a483-e326-492a-83a6-deb337bce0d9'
AND (
  title ILIKE '%jacket%'
  OR title ILIKE '%bodywarmer%'
  OR title ILIKE '%parka%'
);


UPDATE public.shop_products
SET category_id = (
  SELECT id
  FROM public.shop_categories
  WHERE slug = 'apparel-golfers'
)
WHERE category_id = 'de57a483-e326-492a-83a6-deb337bce0d9'
AND (
  title ILIKE '%golfer%'
  OR title ILIKE '%polo%'
);


UPDATE public.shop_products
SET category_id = (
  SELECT id
  FROM public.shop_categories
  WHERE slug = 'apparel-t-shirts'
)
WHERE category_id = 'de57a483-e326-492a-83a6-deb337bce0d9'
AND (
  title ILIKE '%t-shirt%'
  OR title ILIKE '%tee%'
  OR title ILIKE '%crew neck%'
);


UPDATE public.shop_products
SET category_id = (
  SELECT id
  FROM public.shop_categories
  WHERE slug = 'apparel-hoodies'
)
WHERE category_id = 'de57a483-e326-492a-83a6-deb337bce0d9'
AND (
  title ILIKE '%hoody%'
  OR title ILIKE '%hooded%'
  OR title ILIKE '%sweater%'
  OR title ILIKE '%jersey%'
  OR title ILIKE '%cardigan%'
);


UPDATE public.shop_products
SET category_id = (
  SELECT id
  FROM public.shop_categories
  WHERE slug = 'apparel-shirts'
)
WHERE category_id = 'de57a483-e326-492a-83a6-deb337bce0d9'
AND (
  title ILIKE '%shirt%'
  OR title ILIKE '%blouse%'
  OR title ILIKE '%lounge shirt%'
);


UPDATE public.shop_products
SET category_id = (
  SELECT id
  FROM public.shop_categories
  WHERE slug = 'apparel-pants'
)
WHERE category_id = 'de57a483-e326-492a-83a6-deb337bce0d9'
AND (
  title ILIKE '%pant%'
  OR title ILIKE '%jean%'
  OR title ILIKE '%trousers%'
  OR title ILIKE '%short%'
);