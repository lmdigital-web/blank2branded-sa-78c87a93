
-- ad_campaigns
CREATE TABLE public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network text NOT NULL,
  name text NOT NULL,
  objective text,
  status text NOT NULL DEFAULT 'draft',
  budget_cents integer DEFAULT 0,
  spend_cents integer DEFAULT 0,
  start_date date,
  end_date date,
  utm_campaign text,
  target_url text,
  creative_url text,
  ad_copy text,
  notes text,
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_campaigns TO authenticated;
GRANT ALL ON public.ad_campaigns TO service_role;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ad_campaigns" ON public.ad_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_ad_campaigns_updated BEFORE UPDATE ON public.ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ad_pixels
CREATE TABLE public.ad_pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network text NOT NULL UNIQUE,
  pixel_id text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ad_pixels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_pixels TO authenticated;
GRANT ALL ON public.ad_pixels TO service_role;
ALTER TABLE public.ad_pixels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read enabled pixels" ON public.ad_pixels FOR SELECT
  USING (enabled = true);
CREATE POLICY "Admins manage pixels" ON public.ad_pixels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_ad_pixels_updated BEFORE UPDATE ON public.ad_pixels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed pixel rows for the five networks
INSERT INTO public.ad_pixels (network, enabled) VALUES
  ('meta', false),
  ('tiktok', false),
  ('google', false),
  ('pinterest', false),
  ('bing', false)
ON CONFLICT (network) DO NOTHING;

-- ad_events (client-side tracking log)
CREATE TABLE public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  network text,
  value_cents integer,
  currency text DEFAULT 'ZAR',
  order_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  url text,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.ad_events TO anon, authenticated;
GRANT SELECT, DELETE ON public.ad_events TO authenticated;
GRANT ALL ON public.ad_events TO service_role;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log ad events" ON public.ad_events FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Admins can read ad events" ON public.ad_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete ad events" ON public.ad_events FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_ad_events_created ON public.ad_events (created_at DESC);
CREATE INDEX idx_ad_events_utm ON public.ad_events (utm_source, utm_campaign);

-- ad_utm_links
CREATE TABLE public.ad_utm_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_url text NOT NULL,
  utm_source text NOT NULL,
  utm_medium text NOT NULL,
  utm_campaign text NOT NULL,
  utm_content text,
  utm_term text,
  full_url text NOT NULL,
  campaign_id uuid REFERENCES public.ad_campaigns(id) ON DELETE SET NULL,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_utm_links TO authenticated;
GRANT ALL ON public.ad_utm_links TO service_role;
ALTER TABLE public.ad_utm_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage utm links" ON public.ad_utm_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
