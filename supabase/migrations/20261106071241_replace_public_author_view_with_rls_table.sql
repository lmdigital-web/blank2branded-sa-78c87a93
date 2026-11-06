-- Replace the SECURITY DEFINER public author view with a narrow,
-- RLS-protected table containing only fields intended for public display.
-- The source authors table remains admin-managed and retains its email field.

DROP VIEW IF EXISTS public.authors_public;

CREATE TABLE public.authors_public (
  id uuid PRIMARY KEY
    REFERENCES public.authors(id) ON UPDATE CASCADE ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  bio text,
  credentials text,
  avatar_url text,
  website text,
  social jsonb,
  expertise text[],
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

ALTER TABLE public.authors_public ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.authors_public FROM anon, authenticated;
GRANT SELECT ON public.authors_public TO anon, authenticated;

CREATE POLICY "Public author profiles are readable"
  ON public.authors_public
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION private.sync_public_author_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  INSERT INTO public.authors_public
    (id, name, slug, bio, credentials, avatar_url, website, social, expertise, created_at, updated_at)
  VALUES
    (NEW.id, NEW.name, NEW.slug, NEW.bio, NEW.credentials, NEW.avatar_url, NEW.website, NEW.social, NEW.expertise, NEW.created_at, NEW.updated_at)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    bio = EXCLUDED.bio,
    credentials = EXCLUDED.credentials,
    avatar_url = EXCLUDED.avatar_url,
    website = EXCLUDED.website,
    social = EXCLUDED.social,
    expertise = EXCLUDED.expertise,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.sync_public_author_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sync_public_author_profile() FROM anon, authenticated;

CREATE TRIGGER trg_sync_public_author_profile
  AFTER INSERT OR UPDATE ON public.authors
  FOR EACH ROW
  EXECUTE FUNCTION private.sync_public_author_profile();

INSERT INTO public.authors_public
  (id, name, slug, bio, credentials, avatar_url, website, social, expertise, created_at, updated_at)
SELECT
  id, name, slug, bio, credentials, avatar_url, website, social, expertise, created_at, updated_at
FROM public.authors
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  bio = EXCLUDED.bio,
  credentials = EXCLUDED.credentials,
  avatar_url = EXCLUDED.avatar_url,
  website = EXCLUDED.website,
  social = EXCLUDED.social,
  expertise = EXCLUDED.expertise,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;
