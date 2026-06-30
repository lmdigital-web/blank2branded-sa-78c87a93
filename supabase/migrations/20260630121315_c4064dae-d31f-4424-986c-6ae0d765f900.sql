
-- Repoint posts.author_id from auth.users to public.authors (profiles), and add a separate created_by for auth tracking.
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
-- Existing author_id values likely point at auth.users rather than authors; migrate them to created_by then clear.
UPDATE public.posts SET created_by = author_id WHERE created_by IS NULL AND author_id IS NOT NULL;
UPDATE public.posts SET author_id = NULL WHERE author_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.authors a WHERE a.id = posts.author_id);
ALTER TABLE public.posts ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.authors(id) ON DELETE SET NULL;
-- Default existing posts to the seeded "Blank2Branded Team" author for E-E-A-T.
UPDATE public.posts SET author_id = (SELECT id FROM public.authors WHERE slug = 'blank2branded-team' LIMIT 1)
  WHERE author_id IS NULL;
