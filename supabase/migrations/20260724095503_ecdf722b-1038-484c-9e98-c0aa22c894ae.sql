
-- Add stock column to variants
ALTER TABLE public.shop_product_variants
  ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS hex_code text;

-- Add source item number to products for traceability
ALTER TABLE public.shop_products
  ADD COLUMN IF NOT EXISTS supplier_item_number text,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS product_features text;
CREATE INDEX IF NOT EXISTS shop_products_supplier_item_idx ON public.shop_products(supplier_item_number);

-- Missing categories
INSERT INTO public.shop_categories (name, slug, position) VALUES
  ('Gifting', 'gifting', 20),
  ('Bags', 'bags', 21),
  ('Homeware', 'homeware', 22),
  ('Work Wear', 'work-wear', 23),
  ('Sport', 'sport', 24),
  ('Head Wear', 'head-wear', 25),
  ('Display', 'display-cat', 26),
  ('Sublimation', 'sublimation-cat', 27),
  ('Chef Wear', 'chef-wear', 28)
ON CONFLICT (slug) DO NOTHING;

-- Branding options table
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
CREATE INDEX IF NOT EXISTS shop_product_branding_options_product_idx ON public.shop_product_branding_options(product_id);

GRANT SELECT ON public.shop_product_branding_options TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_product_branding_options TO authenticated;
GRANT ALL ON public.shop_product_branding_options TO service_role;

ALTER TABLE public.shop_product_branding_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Branding options viewable by everyone" ON public.shop_product_branding_options FOR SELECT USING (true);
CREATE POLICY "Admins manage branding options" ON public.shop_product_branding_options FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_shop_branding_options_updated
  BEFORE UPDATE ON public.shop_product_branding_options
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
