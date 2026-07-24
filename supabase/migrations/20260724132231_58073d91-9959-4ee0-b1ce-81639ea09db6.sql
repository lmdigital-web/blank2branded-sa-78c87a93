ALTER TABLE public.shop_products
  ADD COLUMN IF NOT EXISTS collection text NOT NULL DEFAULT 'corporate';

ALTER TABLE public.shop_products
  DROP CONSTRAINT IF EXISTS shop_products_collection_check;

ALTER TABLE public.shop_products
  ADD CONSTRAINT shop_products_collection_check
  CHECK (collection IN ('apparel','corporate','both'));

UPDATE public.shop_products SET collection = 'apparel'
WHERE handle IN (
  'platinum-t-shirt',
  'unisex-dry-fit-t-shirt',
  'heavyweight-t-shirt-180gsm',
  'lightweight-t-shirt-140gsm-premium-blank-cotton-tee-for-printing-branding-south-africa',
  'long-sleeve-t-shirt',
  'hoodie',
  'fleece-hoodie-zip',
  'sweater'
);

UPDATE public.shop_products SET collection = 'both'
WHERE handle IN (
  'dtf-print-a4',
  'dtf-print-1-meter-20cm-wide',
  'artwork-setup-fee',
  'dtf-print-add-on'
);

CREATE INDEX IF NOT EXISTS shop_products_collection_idx ON public.shop_products (collection);