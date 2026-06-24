
DROP POLICY IF EXISTS "Anyone can submit quote requests" ON public.quote_requests;
REVOKE INSERT ON public.quote_requests FROM anon;
-- service_role retains ALL access; edge function uses service role to insert.
