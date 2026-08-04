BEGIN;
UPDATE public.shop_products 
SET status = 'published' 
WHERE status = 'draft';
COMMIT;