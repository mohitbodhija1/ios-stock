-- Add image_url column to menu_items
alter table public.menu_items
  add column if not exists image_url text;

-- Create the menu-images storage bucket (public)
insert into storage.buckets (id, name, public)
  values ('menu-images', 'menu-images', true)
  on conflict (id) do nothing;

-- Allow authenticated users to upload menu images
create policy "Authenticated users can upload menu images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-images');

-- Allow public to view menu images
create policy "Public can view menu images"
  on storage.objects for select
  to public
  using (bucket_id = 'menu-images');
