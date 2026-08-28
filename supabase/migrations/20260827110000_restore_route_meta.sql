-- Restore route_meta for the SEO Meta Editor

CREATE TABLE IF NOT EXISTS public.route_meta (
  slug TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  canonical TEXT,
  og_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.route_meta TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.route_meta TO authenticated;
GRANT ALL ON public.route_meta TO service_role;

ALTER TABLE public.route_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "route_meta public read" ON public.route_meta;
CREATE POLICY "route_meta public read"
  ON public.route_meta FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "route_meta admin insert" ON public.route_meta;
CREATE POLICY "route_meta admin insert"
  ON public.route_meta FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "route_meta admin update" ON public.route_meta;
CREATE POLICY "route_meta admin update"
  ON public.route_meta FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "route_meta admin delete" ON public.route_meta;
CREATE POLICY "route_meta admin delete"
  ON public.route_meta FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS route_meta_set_updated_at ON public.route_meta;
CREATE TRIGGER route_meta_set_updated_at
  BEFORE UPDATE ON public.route_meta
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
