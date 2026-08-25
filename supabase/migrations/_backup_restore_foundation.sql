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


-- ------------------------------------------------------------
-- END FOUNDATION
-- ------------------------------------------------------------