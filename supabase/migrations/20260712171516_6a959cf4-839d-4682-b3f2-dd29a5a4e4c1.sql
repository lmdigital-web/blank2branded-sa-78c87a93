
-- Drop public read policy on base table
DROP POLICY IF EXISTS "Public can read authors" ON public.authors;

-- Admins can still read full row via existing "Admins manage authors" ALL policy.
-- Create a safe public view without the email column.
CREATE OR REPLACE VIEW public.authors_public
WITH (security_invoker=on) AS
SELECT id, name, slug, bio, credentials, avatar_url, website, social, expertise, created_at, updated_at
FROM public.authors;

GRANT SELECT ON public.authors_public TO anon, authenticated;
