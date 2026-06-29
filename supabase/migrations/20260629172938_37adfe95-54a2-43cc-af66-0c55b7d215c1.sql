CREATE TABLE public.seo_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  google_ping_ok BOOLEAN NOT NULL DEFAULT false,
  google_ping_status INT,
  indexnow_ok BOOLEAN NOT NULL DEFAULT false,
  indexnow_status INT,
  indexing_state TEXT,
  indexing_coverage TEXT,
  indexing_checked_at TIMESTAMPTZ
);
CREATE INDEX seo_submissions_post_id_idx ON public.seo_submissions(post_id);
CREATE INDEX seo_submissions_submitted_at_idx ON public.seo_submissions(submitted_at DESC);

GRANT SELECT ON public.seo_submissions TO authenticated;
GRANT ALL ON public.seo_submissions TO service_role;

ALTER TABLE public.seo_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read seo submissions"
  ON public.seo_submissions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;