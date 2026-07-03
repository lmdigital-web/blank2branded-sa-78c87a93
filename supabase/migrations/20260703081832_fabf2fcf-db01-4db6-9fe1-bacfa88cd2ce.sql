DROP POLICY IF EXISTS "Anyone can record a blog click" ON public.blog_clicks;
CREATE POLICY "Anyone can record a blog click"
ON public.blog_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (post_id IS NULL OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = blog_clicks.post_id AND p.status = 'published'))
  AND (user_agent IS NULL OR length(user_agent) <= 512)
  AND (ref_code IS NULL OR length(ref_code) <= 64)
  AND (product_handle IS NULL OR length(product_handle) <= 200)
  AND (product_id IS NULL OR length(product_id) <= 64)
  AND (session_id IS NULL OR length(session_id) <= 128)
);