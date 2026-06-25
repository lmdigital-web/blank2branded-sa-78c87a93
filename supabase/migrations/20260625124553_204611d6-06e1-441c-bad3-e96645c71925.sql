
-- Allow scheduled status for posts and update public read policy to surface posts whose scheduled time has passed
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.posts;
CREATE POLICY "Published or due scheduled posts are viewable by everyone"
ON public.posts
FOR SELECT
TO anon, authenticated
USING (
  status = 'published'
  OR (status = 'scheduled' AND published_at IS NOT NULL AND published_at <= now())
);
