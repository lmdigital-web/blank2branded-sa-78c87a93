
-- =====================================================
-- CATEGORIES
-- =====================================================
CREATE TABLE public.shop_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES public.shop_categories(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shop_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_categories TO authenticated;
GRANT ALL ON public.shop_categories TO service_role;

ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON public.shop_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins manage categories"
  ON public.shop_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_shop_categories_updated_at
  BEFORE UPDATE ON public.shop_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- PRODUCTS
-- =====================================================
CREATE TABLE public.shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  handle text NOT NULL UNIQUE,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  base_price numeric(10,2),
  currency_code text NOT NULL DEFAULT 'ZAR',
  category_id uuid REFERENCES public.shop_categories(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX shop_products_status_idx ON public.shop_products(status);
CREATE INDEX shop_products_category_idx ON public.shop_products(category_id);

GRANT SELECT ON public.shop_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_products TO authenticated;
GRANT ALL ON public.shop_products TO service_role;

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published products viewable by everyone"
  ON public.shop_products FOR SELECT
  USING (status = 'published' OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage products"
  ON public.shop_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_shop_products_updated_at
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- PRODUCT IMAGES
-- =====================================================
CREATE TABLE public.shop_product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX shop_product_images_product_idx ON public.shop_product_images(product_id);

GRANT SELECT ON public.shop_product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_product_images TO authenticated;
GRANT ALL ON public.shop_product_images TO service_role;

ALTER TABLE public.shop_product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product images viewable by everyone"
  ON public.shop_product_images FOR SELECT
  USING (true);

CREATE POLICY "Admins manage product images"
  ON public.shop_product_images FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- PRODUCT VARIANTS
-- =====================================================
CREATE TABLE public.shop_product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  option1_name text,
  option1_value text,
  option2_name text,
  option2_value text,
  option3_name text,
  option3_value text,
  price numeric(10,2) NOT NULL,
  currency_code text NOT NULL DEFAULT 'ZAR',
  sku text,
  available boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX shop_product_variants_product_idx ON public.shop_product_variants(product_id);

GRANT SELECT ON public.shop_product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_product_variants TO authenticated;
GRANT ALL ON public.shop_product_variants TO service_role;

ALTER TABLE public.shop_product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants viewable by everyone"
  ON public.shop_product_variants FOR SELECT
  USING (true);

CREATE POLICY "Admins manage variants"
  ON public.shop_product_variants FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_shop_product_variants_updated_at
  BEFORE UPDATE ON public.shop_product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- QUOTE REQUESTS
-- =====================================================
CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','quoted','closed')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  item_count integer NOT NULL DEFAULT 0,
  estimated_total numeric(10,2),
  currency_code text NOT NULL DEFAULT 'ZAR',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX quote_requests_status_idx ON public.quote_requests(status);
CREATE INDEX quote_requests_created_idx ON public.quote_requests(created_at DESC);

GRANT INSERT ON public.quote_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a quote request (guest checkout)
CREATE POLICY "Anyone can submit quote requests"
  ON public.quote_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view quote requests"
  ON public.quote_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update quote requests"
  ON public.quote_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete quote requests"
  ON public.quote_requests FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
