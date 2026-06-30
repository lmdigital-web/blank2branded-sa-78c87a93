
-- Singleton settings table
CREATE TABLE public.app_settings (
  id text PRIMARY KEY DEFAULT 'default',
  social_webhook_url text,
  auto_post_facebook_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id = 'default')
);

GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view app settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert app settings"
  ON public.app_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update app settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER app_settings_set_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- Webhook tracking on posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS social_ping_status text,
  ADD COLUMN IF NOT EXISTS social_ping_error text,
  ADD COLUMN IF NOT EXISTS social_ping_at timestamptz;
