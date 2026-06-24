
-- shop_products
DROP POLICY IF EXISTS "Admins manage products" ON public.shop_products;
CREATE POLICY "Admins manage products"
  ON public.shop_products FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- shop_categories
DROP POLICY IF EXISTS "Admins manage categories" ON public.shop_categories;
CREATE POLICY "Admins manage categories"
  ON public.shop_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- shop_product_variants
DROP POLICY IF EXISTS "Admins manage variants" ON public.shop_product_variants;
CREATE POLICY "Admins manage variants"
  ON public.shop_product_variants FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- shop_product_images
DROP POLICY IF EXISTS "Admins manage product images" ON public.shop_product_images;
CREATE POLICY "Admins manage product images"
  ON public.shop_product_images FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- quote_requests admin policies
DROP POLICY IF EXISTS "Admins can view quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Admins can update quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Admins can delete quote requests" ON public.quote_requests;
CREATE POLICY "Admins can view quote requests"
  ON public.quote_requests FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update quote requests"
  ON public.quote_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete quote requests"
  ON public.quote_requests FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
