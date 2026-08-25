-- Restore Blank2Branded Shop foundation only.
-- Deliberately excludes checkout, orders, quote_requests and payment.

CREATE TABLE IF NOT EXISTS public.shop_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES public.shop_categories(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  handle text NOT NULL UNIQUE,
  description text,
  base_price numeric,
  currency_code text NOT NULL DEFAULT 'ZAR',
  category_id uuid REFERENCES public.shop_categories(id) ON DELETE SET NULL,
  collection text NOT NULL DEFAULT 'corporate',
  position integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  meta_title text,
  meta_description text,
  supplier_item_number text,
  brand text,
  product_features text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  sku text,
  option1_name text,
  option1_value text,
  option2_name text,
  option2_value text,
  option3_name text,
  option3_value text,
  price numeric NOT NULL,
  currency_code text NOT NULL DEFAULT 'ZAR',
  available boolean NOT NULL DEFAULT true,
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  hex_code text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_product_branding_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  branding_type text NOT NULL,
  position text,
  branding_size text,
  max_colour_count integer,
  unit_cost numeric(10,2) NOT NULL DEFAULT 0,
  setup_fee numeric(10,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_products_status_position_idx
  ON public.shop_products(status, position);

CREATE INDEX IF NOT EXISTS shop_products_supplier_item_idx
  ON public.shop_products(supplier_item_number);

CREATE INDEX IF NOT EXISTS shop_products_collection_idx
  ON public.shop_products(collection);

CREATE INDEX IF NOT EXISTS shop_product_variants_product_idx
  ON public.shop_product_variants(product_id);

CREATE INDEX IF NOT EXISTS shop_product_images_product_idx
  ON public.shop_product_images(product_id);

CREATE INDEX IF NOT EXISTS shop_product_branding_options_product_idx
  ON public.shop_product_branding_options(product_id);

ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_product_branding_options ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.shop_categories TO anon, authenticated;
GRANT SELECT ON public.shop_products TO anon, authenticated;
GRANT SELECT ON public.shop_product_variants TO anon, authenticated;
GRANT SELECT ON public.shop_product_images TO anon, authenticated;
GRANT SELECT ON public.shop_product_branding_options TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.shop_categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shop_products TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shop_product_variants TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shop_product_images TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shop_product_branding_options TO authenticated;

GRANT ALL ON public.shop_categories TO service_role;
GRANT ALL ON public.shop_products TO service_role;
GRANT ALL ON public.shop_product_variants TO service_role;
GRANT ALL ON public.shop_product_images TO service_role;
GRANT ALL ON public.shop_product_branding_options TO service_role;

CREATE POLICY "Public can read shop categories"
  ON public.shop_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can read published products"
  ON public.shop_products FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Public can read product variants"
  ON public.shop_product_variants FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_products p
      WHERE p.id = shop_product_variants.product_id
      AND p.status = 'published'
    )
  );

CREATE POLICY "Public can read product images"
  ON public.shop_product_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_products p
      WHERE p.id = shop_product_images.product_id
      AND p.status = 'published'
    )
  );

CREATE POLICY "Public can read branding options"
  ON public.shop_product_branding_options FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_products p
      WHERE p.id = shop_product_branding_options.product_id
      AND p.status = 'published'
    )
  );

CREATE POLICY "Admins manage shop categories"
  ON public.shop_categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage shop products"
  ON public.shop_products FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage shop variants"
  ON public.shop_product_variants FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage shop images"
  ON public.shop_product_images FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage branding options"
  ON public.shop_product_branding_options FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_shop_categories_updated_at
  BEFORE UPDATE ON public.shop_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_shop_products_updated_at
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_shop_product_variants_updated_at
  BEFORE UPDATE ON public.shop_product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_shop_branding_options_updated
  BEFORE UPDATE ON public.shop_product_branding_options
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
