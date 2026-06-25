DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.posts;
CREATE POLICY "Published posts are viewable by everyone" ON public.posts FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can view all posts" ON public.posts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));