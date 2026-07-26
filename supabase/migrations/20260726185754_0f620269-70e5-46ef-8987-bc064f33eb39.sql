
-- Embroidery
UPDATE public.shop_product_branding_options SET unit_cost = 28, setup_fee = 155 WHERE branding_type = 'Embroidery' AND branding_size IN ('10cm x 10cm','5cm x 5cm');
UPDATE public.shop_product_branding_options SET unit_cost = 45, setup_fee = 155 WHERE branding_type = 'Embroidery' AND branding_size = '15cm x 15cm';
UPDATE public.shop_product_branding_options SET unit_cost = 75, setup_fee = 155 WHERE branding_type = 'Embroidery' AND branding_size = '20cm x 20cm';
UPDATE public.shop_product_branding_options SET unit_cost = 115, setup_fee = 155 WHERE branding_type = 'Embroidery' AND branding_size = 'Larger than 20 x 20 cm';
UPDATE public.shop_product_branding_options SET unit_cost = 38, setup_fee = 155 WHERE branding_type = 'Embroidery' AND branding_size = 'Personalised Naming';
UPDATE public.shop_product_branding_options SET setup_fee = 155 WHERE branding_type = 'Embroidery';

-- DTF
UPDATE public.shop_product_branding_options SET unit_cost = 35 WHERE branding_type = 'DTF (Direct to film)' AND branding_size = 'A6';
UPDATE public.shop_product_branding_options SET unit_cost = 45 WHERE branding_type = 'DTF (Direct to film)' AND branding_size = 'A5';
UPDATE public.shop_product_branding_options SET unit_cost = 60 WHERE branding_type = 'DTF (Direct to film)' AND branding_size = 'A4';
UPDATE public.shop_product_branding_options SET unit_cost = 15 WHERE branding_type = 'DTF (Direct to film)' AND branding_size = '100mm x 30mm';
UPDATE public.shop_product_branding_options SET unit_cost = 25 WHERE branding_type = 'DTF (Direct to film)' AND branding_size = '100mm x 60mm';
UPDATE public.shop_product_branding_options SET unit_cost = 35 WHERE branding_type = 'DTF (Direct to film)' AND branding_size = 'Personalised Naming and Numbering';

-- Heat Press
UPDATE public.shop_product_branding_options SET unit_cost = 10 WHERE branding_type = 'Heat Press' AND branding_size = '3cm x 3cm';
UPDATE public.shop_product_branding_options SET unit_cost = 14 WHERE branding_type = 'Heat Press' AND branding_size IN ('5cm x 5cm','5cm x 6cm');
UPDATE public.shop_product_branding_options SET unit_cost = 22 WHERE branding_type = 'Heat Press' AND branding_size IN ('9cm x 9cm','8cm x 8cm','6cm x 7cm');
UPDATE public.shop_product_branding_options SET unit_cost = 35 WHERE branding_type = 'Heat Press' AND branding_size IN ('12cm x 12cm','10cm x 10cm','A5');
UPDATE public.shop_product_branding_options SET unit_cost = 60 WHERE branding_type = 'Heat Press' AND branding_size IN ('Larger than 12 x 12 cm','20cm x 20cm','A4');
UPDATE public.shop_product_branding_options SET unit_cost = 45 WHERE branding_type = 'Heat Press' AND branding_size = 'Personalised Naming';

-- Screen Printing: R9.50 per colour, up to 10 colours
UPDATE public.shop_product_branding_options SET unit_cost = 9.50, max_colour_count = 10 WHERE branding_type IN ('Screen Printing','Screen Printing Manual');
