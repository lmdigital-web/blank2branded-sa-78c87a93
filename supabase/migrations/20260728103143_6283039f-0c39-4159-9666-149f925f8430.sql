
-- bofu_pages: split anon (published only) from authenticated (published or admin)
DROP POLICY IF EXISTS "Public can view published bofu pages" ON public.bofu_pages;
CREATE POLICY "Anon can view published bofu pages"
  ON public.bofu_pages FOR SELECT TO anon
  USING (status = 'published');
CREATE POLICY "Authenticated can view published or all if admin"
  ON public.bofu_pages FOR SELECT TO authenticated
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'::app_role));

-- categories: admin-manage policy must not run for anon
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- user_roles: admin view policy must not run for anon
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
CREATE POLICY "Admins can view roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
