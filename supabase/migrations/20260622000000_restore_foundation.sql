-- ============================================================
-- Blank2Branded - Restored Database Foundation
-- ============================================================

-- ------------------------------------------------------------
-- 1. Application role enum
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'app_role'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END
$$;


-- ------------------------------------------------------------
-- 2. Shared updated_at trigger function
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ------------------------------------------------------------
-- 3. Profiles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 4. User roles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 5. Admin role-checking function
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(
  _user_id uuid,
  _role public.app_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;


-- ------------------------------------------------------------
-- 6. New-user handler
--
-- First user in the database becomes admin.
-- Subsequent users become normal users.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.app_role;
  display_name_value text;
BEGIN

  display_name_value :=
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.email
    );

  INSERT INTO public.profiles (
    id,
    display_name
  )
  VALUES (
    NEW.id,
    display_name_value
  )
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
  ) THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'user';
  END IF;

  INSERT INTO public.user_roles (
    user_id,
    role
  )
  VALUES (
    NEW.id,
    assigned_role
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;


-- ------------------------------------------------------------
-- 7. Categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 8. Posts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL DEFAULT '',

  cover_image_url text,

  status text NOT NULL DEFAULT 'draft'
    CHECK (
      status = ANY (
        ARRAY[
          'draft'::text,
          'published'::text
        ]
      )
    ),

  meta_title text,
  meta_description text,
  keywords text,

  category_id uuid
    REFERENCES public.categories(id)
    ON DELETE SET NULL,

  author_id uuid,

  created_by uuid
    REFERENCES auth.users(id)
    ON DELETE SET NULL,

  published_at timestamptz,

  experience_notes text,

  social_ping_at timestamptz,
  social_ping_error text,
  social_ping_status text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 9. Post views
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  post_id uuid NOT NULL
    REFERENCES public.posts(id)
    ON DELETE CASCADE,

  country text,
  referrer text,

  viewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 10. Updated-at trigger for profiles
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_profiles_updated_at
ON public.profiles;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ------------------------------------------------------------
-- 11. Basic indexes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_posts_slug
ON public.posts(slug);

CREATE INDEX IF NOT EXISTS idx_posts_status
ON public.posts(status);

CREATE INDEX IF NOT EXISTS idx_posts_published_at
ON public.posts(published_at);

CREATE INDEX IF NOT EXISTS idx_posts_category_id
ON public.posts(category_id);

CREATE INDEX IF NOT EXISTS idx_posts_created_by
ON public.posts(created_by);

CREATE INDEX IF NOT EXISTS idx_post_views_post_id
ON public.post_views(post_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
ON public.user_roles(user_id);


-- ============================================================
-- SHOP FOUNDATION RESTORE
-- Reconstructs missing ecommerce tables required by later
-- migrations and the existing application.
-- ============================================================

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

-- Indexes required by the application and later migrations.
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

-- RLS
ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_product_images ENABLE ROW LEVEL SECURITY;

-- Public catalogue reads.
CREATE POLICY "Public can read shop categories"
  ON public.shop_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can read published products"
  ON public.shop_products
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Public can read product variants"
  ON public.shop_product_variants
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.shop_products p
      WHERE p.id = shop_product_variants.product_id
        AND p.status = 'published'
    )
  );

CREATE POLICY "Public can read product images"
  ON public.shop_product_images
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.shop_products p
      WHERE p.id = shop_product_images.product_id
        AND p.status = 'published'
    )
  );

-- Admin management.
CREATE POLICY "Admins manage shop categories"
  ON public.shop_categories
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage shop products"
  ON public.shop_products
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage shop variants"
  ON public.shop_product_variants
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage shop images"
  ON public.shop_product_images
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Permissions.
GRANT SELECT ON public.shop_categories TO anon, authenticated;
GRANT SELECT ON public.shop_products TO anon, authenticated;
GRANT SELECT ON public.shop_product_variants TO anon, authenticated;
GRANT SELECT ON public.shop_product_images TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.shop_categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shop_products TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shop_product_variants TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shop_product_images TO authenticated;

GRANT ALL ON public.shop_categories TO service_role;
GRANT ALL ON public.shop_products TO service_role;
GRANT ALL ON public.shop_product_variants TO service_role;
GRANT ALL ON public.shop_product_images TO service_role;

-- Updated-at triggers.
CREATE TRIGGER trg_shop_categories_updated_at
  BEFORE UPDATE ON public.shop_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_shop_products_updated_at
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_shop_product_variants_updated_at
  BEFORE UPDATE ON public.shop_product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- END FOUNDATION
-- ------------------------------------------------------------