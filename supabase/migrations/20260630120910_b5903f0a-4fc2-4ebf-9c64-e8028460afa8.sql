
CREATE TABLE public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text,
  credentials text,
  avatar_url text,
  email text,
  website text,
  social jsonb DEFAULT '{}'::jsonb,
  expertise text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.authors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authors TO authenticated;
GRANT ALL ON public.authors TO service_role;

ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read authors" ON public.authors
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage authors" ON public.authors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_authors_updated_at
  BEFORE UPDATE ON public.authors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES public.authors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS experience_notes text;

-- Seed a default author so existing posts can be linked manually later
INSERT INTO public.authors (name, slug, bio, credentials)
VALUES ('Blank2Branded Team', 'blank2branded-team',
  'The Blank2Branded editorial team covering apparel branding, DTF printing, and South African ecommerce.',
  'In-house apparel & print specialists, Johannesburg.')
ON CONFLICT (slug) DO NOTHING;
