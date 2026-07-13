
-- Fix missing table grants on BOFU tables so PostgREST doesn't 401
GRANT SELECT ON public.bofu_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bofu_pages TO authenticated;
GRANT ALL ON public.bofu_pages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bofu_keywords TO authenticated;
GRANT ALL ON public.bofu_keywords TO service_role;

-- Lock down SECURITY DEFINER helper: RLS policy evaluation doesn't need caller EXECUTE
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated, anon, public;
