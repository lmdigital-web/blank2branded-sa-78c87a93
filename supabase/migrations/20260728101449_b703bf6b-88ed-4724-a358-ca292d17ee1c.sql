
DROP POLICY IF EXISTS "Images of published products are viewable" ON public.shop_product_images;
DROP POLICY IF EXISTS "Variants of published products are viewable" ON public.shop_product_variants;
DROP POLICY IF EXISTS "Branding options of published products are viewable" ON public.shop_product_branding_options;

CREATE POLICY "Anon: images of published products" ON public.shop_product_images FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.shop_products p WHERE p.id = shop_product_images.product_id AND p.status = 'published'));
CREATE POLICY "Auth: images of published products or admin" ON public.shop_product_images FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.shop_products p WHERE p.id = shop_product_images.product_id AND (p.status = 'published' OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Anon: variants of published products" ON public.shop_product_variants FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.shop_products p WHERE p.id = shop_product_variants.product_id AND p.status = 'published'));
CREATE POLICY "Auth: variants of published products or admin" ON public.shop_product_variants FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.shop_products p WHERE p.id = shop_product_variants.product_id AND (p.status = 'published' OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Anon: branding of published products" ON public.shop_product_branding_options FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.shop_products p WHERE p.id = shop_product_branding_options.product_id AND p.status = 'published'));
CREATE POLICY "Auth: branding of published products or admin" ON public.shop_product_branding_options FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.shop_products p WHERE p.id = shop_product_branding_options.product_id AND (p.status = 'published' OR public.has_role(auth.uid(), 'admin'))));
