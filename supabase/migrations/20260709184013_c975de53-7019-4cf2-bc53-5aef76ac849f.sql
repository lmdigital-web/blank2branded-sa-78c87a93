
-- bofu_pages
CREATE TABLE public.bofu_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  template TEXT NOT NULL CHECK (template IN ('versus','alternatives','best','local')),
  keyword TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  h1 TEXT,
  intro TEXT,
  body_html TEXT,
  video_url TEXT,
  video_platform TEXT,
  video_embed_html TEXT,
  faq_json JSONB DEFAULT '[]'::jsonb,
  comparison_json JSONB DEFAULT '{}'::jsonb,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at TIMESTAMPTZ,
  author_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template, slug, city)
);

GRANT SELECT ON public.bofu_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bofu_pages TO authenticated;
GRANT ALL ON public.bofu_pages TO service_role;

ALTER TABLE public.bofu_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published bofu pages"
  ON public.bofu_pages FOR SELECT
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage bofu pages"
  ON public.bofu_pages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER bofu_pages_updated_at
  BEFORE UPDATE ON public.bofu_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX bofu_pages_status_idx ON public.bofu_pages (status);
CREATE INDEX bofu_pages_template_idx ON public.bofu_pages (template);

-- bofu_keywords
CREATE TABLE public.bofu_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  intent TEXT CHECK (intent IN ('versus','alternatives','best','local','price','other')),
  volume INT,
  difficulty NUMERIC,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','queued','published','dismissed')),
  page_id UUID REFERENCES public.bofu_pages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (keyword)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bofu_keywords TO authenticated;
GRANT ALL ON public.bofu_keywords TO service_role;

ALTER TABLE public.bofu_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage bofu keywords"
  ON public.bofu_keywords FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER bofu_keywords_updated_at
  BEFORE UPDATE ON public.bofu_keywords
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
