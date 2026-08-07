-- Define parent IDs
DO $$
DECLARE
    gifting_id uuid := 'cad7a11d-4f06-43f8-b232-0a3a3e4d229e';
    bags_id uuid := '3f9fb8f5-28e0-4e06-9104-b01b930ad32e';
    workwear_id uuid := 'b9804edc-1043-4d14-869d-2f75802a4b31';
    homeware_id uuid := 'b78ef09b-8707-4c52-a15f-4bdfe81bfda4';
    headwear_id uuid := '8ffb17d2-933f-4af8-ac89-9b06011c5058';
    
    sub_id uuid;
BEGIN
    -- GIFTING SUBCATEGORIES
    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Pens & Writing', 'gifting-pens', gifting_id, 0) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = gifting_id AND (title ILIKE '%pen%' OR title ILIKE '%pencil%' OR title ILIKE '%highlighter%');

    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Drinkware', 'gifting-drinkware', gifting_id, 1) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = gifting_id AND (title ILIKE '%bottle%' OR title ILIKE '%mug%' OR title ILIKE '%cup%' OR title ILIKE '%flask%' OR title ILIKE '%tumbler%');

    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Notebooks & Folders', 'gifting-notebooks', gifting_id, 2) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = gifting_id AND (title ILIKE '%notebook%' OR title ILIKE '%folder%' OR title ILIKE '%diary%' OR title ILIKE '%journal%');

    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Technology', 'gifting-tech', gifting_id, 3) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = gifting_id AND (title ILIKE '%powerbank%' OR title ILIKE '%usb%' OR title ILIKE '%cable%' OR title ILIKE '%speaker%' OR title ILIKE '%bluetooth%' OR title ILIKE '%headphones%' OR title ILIKE '%mousepad%');

    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Umbrellas & Outdoor', 'gifting-outdoor', gifting_id, 4) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = gifting_id AND (title ILIKE '%umbrella%' OR title ILIKE '%cooler%' OR title ILIKE '%camping%' OR title ILIKE '%torch%' OR title ILIKE '%outdoor%');

    -- BAGS SUBCATEGORIES
    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Backpacks', 'bags-backpacks', bags_id, 0) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = bags_id AND (title ILIKE '%backpack%' OR title ILIKE '%knapsack%');

    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Trolleys & Luggage', 'bags-luggage', bags_id, 1) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = bags_id AND (title ILIKE '%trolley%' OR title ILIKE '%luggage%' OR title ILIKE '%suitcases%' OR title ILIKE '%cabin case%');

    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Laptop & Office Bags', 'bags-laptop', bags_id, 2) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = bags_id AND (title ILIKE '%laptop%' OR title ILIKE '%briefcase%' OR title ILIKE '%messenger%' OR title ILIKE '%pilot case%');

    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Totes & Shoppers', 'bags-totes', bags_id, 3) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = bags_id AND (title ILIKE '%tote%' OR title ILIKE '%shopper%' OR title ILIKE '%drawstring%');

    -- WORK WEAR SUBCATEGORIES
    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Conti Suits & Overalls', 'workwear-conti', workwear_id, 0) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = workwear_id AND (title ILIKE '%conti%' OR title ILIKE '%overall%' OR title ILIKE '%boiler%');

    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('High Visibility', 'workwear-hi-viz', workwear_id, 1) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = workwear_id AND (title ILIKE '%waistcoat%' OR title ILIKE '%reflective%' OR title ILIKE '%hi-viz%' OR title ILIKE '%beacon%');

    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Safety Footwear', 'workwear-shoes', workwear_id, 2) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = workwear_id AND (title ILIKE '%shoe%' OR title ILIKE '%boot%' OR title ILIKE '%gumboot%');

    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Safety Gear (PPE)', 'workwear-ppe', workwear_id, 3) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = workwear_id AND (title ILIKE '%hat%' OR title ILIKE '%glove%' OR title ILIKE '%ear%' OR title ILIKE '%mask%' OR title ILIKE '%spectacle%');

    -- HOMEWARE SUBCATEGORIES
    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Kitchen & Dining', 'homeware-kitchen', homeware_id, 0) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = homeware_id AND (title ILIKE '%bowl%' OR title ILIKE '%plate%' OR title ILIKE '%dinner set%' OR title ILIKE '%jug%' OR title ILIKE '%baker%' OR title ILIKE '%casserole%' OR title ILIKE '%kettle%');

    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Mugs & Cups', 'homeware-mugs', homeware_id, 1) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = homeware_id AND (title ILIKE '%mug%' OR title ILIKE '%cup%' OR title ILIKE '%saucer%');

    -- HEAD WEAR SUBCATEGORIES
    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Caps', 'headwear-caps', headwear_id, 0) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = headwear_id AND (title ILIKE '%cap%');

    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Beanies', 'headwear-beanies', headwear_id, 1) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = headwear_id AND (title ILIKE '%beanie%');

    INSERT INTO shop_categories (name, slug, parent_id, position) VALUES ('Hats', 'headwear-hats', headwear_id, 2) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO sub_id;
    UPDATE shop_products SET category_id = sub_id WHERE category_id = headwear_id AND (title ILIKE '%hat%' AND NOT title ILIKE '%cap%');

END $$;
