UPDATE public.ad_pixels
SET extra = jsonb_set(COALESCE(extra, '{}'::jsonb), '{ga4_id}', '"549151538"'),
    enabled = true
WHERE network = 'google';