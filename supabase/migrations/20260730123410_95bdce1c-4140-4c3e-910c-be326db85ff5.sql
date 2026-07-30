with c as (
  select p.id, p.title, p.handle, p.status,
    upper((regexp_match(regexp_replace(p.handle,'-[0-9a-f]{6}$',''),'([a-z]{3}-[0-9]{2}-[a-z]{2})$'))[1]) item,
    (select count(*) from shop_product_variants v where v.product_id = p.id) vc
  from shop_products p
), pairs as (
  select a.id as keep_id, b.id as dup_id
  from c a join c b
    on a.item = b.item and a.id <> b.id and a.title = b.title
  where a.vc = 0 and b.vc > 0 and a.handle !~ '-[0-9a-f]{6}$'
)
select * into temp table _merge_pairs from pairs;

update shop_product_variants v set product_id = m.keep_id from _merge_pairs m where v.product_id = m.dup_id;

update shop_product_images i set product_id = m.keep_id
from _merge_pairs m
where i.product_id = m.dup_id
  and not exists (select 1 from shop_product_images x where x.product_id = m.keep_id and x.url = i.url);

delete from shop_product_branding_options b
using _merge_pairs m
where b.product_id = m.keep_id
  and exists (select 1 from shop_product_branding_options y where y.product_id = m.dup_id);

update shop_product_branding_options b set product_id = m.keep_id from _merge_pairs m where b.product_id = m.dup_id;

update shop_products p set status = 'draft' from _merge_pairs m where p.id = m.dup_id;