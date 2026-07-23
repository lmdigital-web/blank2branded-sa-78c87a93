
-- shop_categories
GRANT SELECT ON public.shop_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_categories TO authenticated;
GRANT ALL ON public.shop_categories TO service_role;

-- shop_products
GRANT SELECT ON public.shop_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_products TO authenticated;
GRANT ALL ON public.shop_products TO service_role;

-- shop_product_variants
GRANT SELECT ON public.shop_product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_product_variants TO authenticated;
GRANT ALL ON public.shop_product_variants TO service_role;

-- shop_product_images
GRANT SELECT ON public.shop_product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_product_images TO authenticated;
GRANT ALL ON public.shop_product_images TO service_role;

-- Faster shop listing
CREATE INDEX IF NOT EXISTS shop_products_status_position_idx
  ON public.shop_products (status, position);
