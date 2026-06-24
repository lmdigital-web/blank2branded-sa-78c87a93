
-- Allow public submissions to quote_requests with safe defaults
CREATE POLICY "Anyone can submit a quote request"
ON public.quote_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND char_length(customer_name) BETWEEN 1 AND 200
  AND char_length(customer_email) BETWEEN 3 AND 320
  AND customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (customer_phone IS NULL OR char_length(customer_phone) <= 40)
  AND (message IS NULL OR char_length(message) <= 5000)
  AND (notes IS NULL OR char_length(notes) <= 2000)
  AND item_count >= 0
  AND item_count <= 1000
);

GRANT INSERT ON public.quote_requests TO anon, authenticated;

-- Storage policies for the private product-images bucket
CREATE POLICY "Admins manage product images - select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins manage product images - insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins manage product images - update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins manage product images - delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
