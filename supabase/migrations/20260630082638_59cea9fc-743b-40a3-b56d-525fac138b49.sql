
-- blog_clicks
CREATE TABLE public.blog_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  product_handle TEXT,
  product_id TEXT,
  ref_code TEXT,
  session_id TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.blog_clicks TO anon, authenticated;
GRANT SELECT ON public.blog_clicks TO authenticated;
GRANT ALL ON public.blog_clicks TO service_role;
ALTER TABLE public.blog_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can record a blog click" ON public.blog_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read blog clicks" ON public.blog_clicks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_blog_clicks_post ON public.blog_clicks(post_id);
CREATE INDEX idx_blog_clicks_clicked_at ON public.blog_clicks(clicked_at DESC);

-- blog_conversions
CREATE TABLE public.blog_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  shopify_order_id TEXT NOT NULL UNIQUE,
  order_number TEXT,
  ref_code TEXT,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  customer_email TEXT,
  line_items JSONB,
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_conversions TO authenticated;
GRANT ALL ON public.blog_conversions TO service_role;
ALTER TABLE public.blog_conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read conversions" ON public.blog_conversions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_blog_conversions_post ON public.blog_conversions(post_id);
CREATE INDEX idx_blog_conversions_ordered_at ON public.blog_conversions(ordered_at DESC);

-- blog_link_issues
CREATE TABLE public.blog_link_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status_code INTEGER,
  issue_type TEXT NOT NULL,
  suggested_handle TEXT,
  resolved_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, url)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_link_issues TO authenticated;
GRANT ALL ON public.blog_link_issues TO service_role;
ALTER TABLE public.blog_link_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage link issues" ON public.blog_link_issues FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_link_issues_post ON public.blog_link_issues(post_id);
CREATE INDEX idx_link_issues_unresolved ON public.blog_link_issues(resolved_at) WHERE resolved_at IS NULL;
