-- Create subcategories under 'Apparel'
INSERT INTO public.shop_categories (name, slug, parent_id, position)
VALUES 
    ('Jackets', 'apparel-jackets', 'de57a483-e326-492a-83a6-deb337bce0d9', 0),
    ('Golfers', 'apparel-golfers', 'de57a483-e326-492a-83a6-deb337bce0d9', 1),
    ('T-Shirts', 'apparel-t-shirts', 'de57a483-e326-492a-83a6-deb337bce0d9', 2),
    ('Hoodies & Sweaters', 'apparel-hoodies', 'de57a483-e326-492a-83a6-deb337bce0d9', 3),
    ('Shirts & Blouses', 'apparel-shirts', 'de57a483-e326-492a-83a6-deb337bce0d9', 4),
    ('Pants & Jeans', 'apparel-pants', 'de57a483-e326-492a-83a6-deb337bce0d9', 5)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- Reassign products based on keywords
UPDATE public.shop_products 
SET category_id = (SELECT id FROM shop_categories WHERE slug = 'apparel-jackets')
WHERE category_id = 'de57a483-e326-492a-83a6-deb337bce0d9' 
AND (title ILIKE '%jacket%' OR title ILIKE '%bodywarmer%' OR title ILIKE '%parka%');

UPDATE public.shop_products 
SET category_id = (SELECT id FROM shop_categories WHERE slug = 'apparel-golfers')
WHERE category_id = 'de57a483-e326-492a-83a6-deb337bce0d9' 
AND (title ILIKE '%golfer%' OR title ILIKE '%polo%');

UPDATE public.shop_products 
SET category_id = (SELECT id FROM shop_categories WHERE slug = 'apparel-t-shirts')
WHERE category_id = 'de57a483-e326-492a-83a6-deb337bce0d9' 
AND (title ILIKE '%t-shirt%' OR title ILIKE '%tee%' OR title ILIKE '%crew neck%');

UPDATE public.shop_products 
SET category_id = (SELECT id FROM shop_categories WHERE slug = 'apparel-hoodies')
WHERE category_id = 'de57a483-e326-492a-83a6-deb337bce0d9' 
AND (title ILIKE '%hoody%' OR title ILIKE '%hooded%' OR title ILIKE '%sweater%' OR title ILIKE '%jersey%' OR title ILIKE '%cardigan%');

UPDATE public.shop_products 
SET category_id = (SELECT id FROM shop_categories WHERE slug = 'apparel-shirts')
WHERE category_id = 'de57a483-e326-492a-83a6-deb337bce0d9' 
AND (title ILIKE '%shirt%' OR title ILIKE '%blouse%' OR title ILIKE '%lounge shirt%');

UPDATE public.shop_products 
SET category_id = (SELECT id FROM shop_categories WHERE slug = 'apparel-pants')
WHERE category_id = 'de57a483-e326-492a-83a6-deb337bce0d9' 
AND (title ILIKE '%pant%' OR title ILIKE '%jean%' OR title ILIKE '%trousers%' OR title ILIKE '%short%');
