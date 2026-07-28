
-- 1. Child tables must respect parent product publication status
DROP POLICY IF EXISTS "Product images viewable by everyone" ON public.shop_product_images;
CREATE POLICY "Images of published products are viewable"
ON public.shop_product_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shop_products p
    WHERE p.id = shop_product_images.product_id
      AND (p.status = 'published' OR public.has_role(auth.uid(), 'admin'))
  )
);

DROP POLICY IF EXISTS "Variants viewable by everyone" ON public.shop_product_variants;
CREATE POLICY "Variants of published products are viewable"
ON public.shop_product_variants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shop_products p
    WHERE p.id = shop_product_variants.product_id
      AND (p.status = 'published' OR public.has_role(auth.uid(), 'admin'))
  )
);

DROP POLICY IF EXISTS "Branding options viewable by everyone" ON public.shop_product_branding_options;
CREATE POLICY "Branding options of published products are viewable"
ON public.shop_product_branding_options FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shop_products p
    WHERE p.id = shop_product_branding_options.product_id
      AND (p.status = 'published' OR public.has_role(auth.uid(), 'admin'))
  )
);

-- 2. Do not let signed-out users execute the SECURITY DEFINER role helper
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- 3. Replace always-true INSERT check on ad_events with a validated one
DROP POLICY IF EXISTS "Anyone can log ad events" ON public.ad_events;
CREATE POLICY "Anyone can log valid ad events"
ON public.ad_events FOR INSERT
WITH CHECK (
  event_type IN ('page_view','view_content','add_to_cart','begin_checkout','purchase','lead','click','signup')
  AND (network IS NULL OR length(network) <= 50)
  AND (value_cents IS NULL OR (value_cents >= 0 AND value_cents <= 100000000))
  AND (currency IS NULL OR length(currency) <= 10)
  AND (url IS NULL OR length(url) <= 2000)
  AND (referrer IS NULL OR length(referrer) <= 2000)
  AND (user_agent IS NULL OR length(user_agent) <= 500)
);
