-- Allow public select on organizations
create policy "Public can view active organizations"
on public.organizations
for select
using (status = 'active');

-- Allow public select on restaurant_locations
create policy "Public can view active locations"
on public.restaurant_locations
for select
using (status = 'active');
