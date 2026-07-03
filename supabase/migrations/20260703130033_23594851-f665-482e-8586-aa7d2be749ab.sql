
-- route_meta: per-route SEO overrides for static pages
CREATE TABLE public.route_meta (
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

CREATE POLICY "route_meta public read"
  ON public.route_meta FOR SELECT
  USING (true);

CREATE POLICY "route_meta admin insert"
  ON public.route_meta FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "route_meta admin update"
  ON public.route_meta FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "route_meta admin delete"
  ON public.route_meta FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER route_meta_set_updated_at
  BEFORE UPDATE ON public.route_meta
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- seo_keywords: keyword tracker for content planning
CREATE TABLE public.seo_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  target_url TEXT,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea','drafting','published')),
  priority INT NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX seo_keywords_status_idx ON public.seo_keywords(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_keywords TO authenticated;
GRANT ALL ON public.seo_keywords TO service_role;

ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seo_keywords admin select"
  ON public.seo_keywords FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "seo_keywords admin insert"
  ON public.seo_keywords FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "seo_keywords admin update"
  ON public.seo_keywords FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "seo_keywords admin delete"
  ON public.seo_keywords FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER seo_keywords_set_updated_at
  BEFORE UPDATE ON public.seo_keywords
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
