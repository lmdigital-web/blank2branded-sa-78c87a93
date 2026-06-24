
DROP POLICY IF EXISTS "Published products viewable by everyone" ON public.shop_products;

CREATE POLICY "Public can read published products"
  ON public.shop_products FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "Authenticated can read published or admin"
  ON public.shop_products FOR SELECT
  TO authenticated
  USING (status = 'published' OR has_role(auth.uid(), 'admin'::app_role));
