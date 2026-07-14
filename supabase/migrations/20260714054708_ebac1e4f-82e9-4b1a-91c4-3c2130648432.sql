GRANT INSERT ON public.post_views TO anon, authenticated;
GRANT SELECT ON public.post_views TO authenticated;
GRANT ALL ON public.post_views TO service_role;