
insert into storage.buckets (id, name, public) values ('blog-images', 'blog-images', true) on conflict (id) do nothing;

create policy "Public can view blog images"
on storage.objects for select
using (bucket_id = 'blog-images');

create policy "Admins can upload blog images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'blog-images' and has_role(auth.uid(), 'admin'));

create policy "Admins can update blog images"
on storage.objects for update
to authenticated
using (bucket_id = 'blog-images' and has_role(auth.uid(), 'admin'));

create policy "Admins can delete blog images"
on storage.objects for delete
to authenticated
using (bucket_id = 'blog-images' and has_role(auth.uid(), 'admin'));
