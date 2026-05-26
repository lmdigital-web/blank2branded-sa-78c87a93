
-- 1. Fix post_views INSERT policy: only allow views on published posts
DROP POLICY IF EXISTS "Anyone can record a view" ON public.post_views;
CREATE POLICY "Anyone can record a view on published posts"
ON public.post_views
FOR INSERT
TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND status = 'published'));

-- 2. Harden has_role against NULL _user_id
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- 4. Remove broad SELECT policy on blog-images storage objects
-- Public bucket files remain accessible via public URLs; this prevents listing via API
DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
