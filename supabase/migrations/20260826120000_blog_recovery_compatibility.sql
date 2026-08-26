-- Additive compatibility migration for the replacement Supabase project.
-- It preserves the recovered posts and authors.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES public.authors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS experience_notes text,
  ADD COLUMN IF NOT EXISTS social_ping_at timestamptz,
  ADD COLUMN IF NOT EXISTS social_ping_error text,
  ADD COLUMN IF NOT EXISTS social_ping_status text;

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_check
  CHECK (status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'published'::text]));

DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Published or due scheduled posts are viewable by everyone" ON public.posts;
CREATE POLICY "Published or due scheduled posts are viewable by everyone"
  ON public.posts FOR SELECT TO anon, authenticated
  USING (status = 'published' OR (status = 'scheduled' AND published_at IS NOT NULL AND published_at <= now()));

DROP POLICY IF EXISTS "Admins can view all posts" ON public.posts;
CREATE POLICY "Admins can view all posts"
  ON public.posts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage posts" ON public.posts;
CREATE POLICY "Admins manage posts"
  ON public.posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.authors_public AS
SELECT id, name, slug, bio, credentials, avatar_url, website, social, expertise, created_at, updated_at
FROM public.authors;
ALTER VIEW public.authors_public SET (security_invoker = false);
GRANT SELECT ON public.authors_public TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can record post views" ON public.post_views;
CREATE POLICY "Anyone can record post views"
  ON public.post_views FOR INSERT TO anon, authenticated
  WITH CHECK (true);
GRANT INSERT ON public.post_views TO anon, authenticated;
GRANT SELECT ON public.post_views TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
CREATE POLICY "Public can view blog images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Admins can manage blog images" ON storage.objects;
CREATE POLICY "Admins can manage blog images"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));