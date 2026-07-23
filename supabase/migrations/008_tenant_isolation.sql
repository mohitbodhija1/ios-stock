-- Tenant isolation: staff only see organizations they belong to.
-- Public org/location reads are limited to anonymous (customer QR) sessions.

drop policy if exists "Public can view active organizations" on public.organizations;
drop policy if exists "Public can view active locations" on public.restaurant_locations;

create policy "Anonymous can view active organizations"
on public.organizations
for select
to anon
using (status = 'active');

create policy "Anonymous can view active locations"
on public.restaurant_locations
for select
to anon
using (status = 'active');

create policy "Users can view own organization memberships"
on public.organization_members
for select
using (user_id = auth.uid());

-- Customer QR flow: resolve table + org + location without tenant membership.
create or replace function public.get_customer_menu_context(table_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_table public.dining_tables%rowtype;
begin
  select * into target_table
  from public.dining_tables
  where public_token = table_token
    and status <> 'inactive';

  if not found then
    raise exception 'invalid_table_token';
  end if;

  return jsonb_build_object(
    'organization', (
      select jsonb_build_object('id', o.id, 'name', o.name, 'slug', o.slug)
      from public.organizations o
      where o.id = target_table.organization_id
    ),
    'location', (
      select jsonb_build_object(
        'id', l.id,
        'organization_id', l.organization_id,
        'name', l.name,
        'slug', l.slug,
        'city', l.city,
        'currency', l.currency
      )
      from public.restaurant_locations l
      where l.id = target_table.location_id
    ),
    'table', jsonb_build_object(
      'id', target_table.id,
      'location_id', target_table.location_id,
      'dining_area_id', target_table.dining_area_id,
      'table_number', target_table.table_number,
      'display_name', coalesce(target_table.display_name, 'Table ' || target_table.table_number),
      'capacity', target_table.capacity,
      'status', target_table.status,
      'public_token', target_table.public_token
    )
  );
end;
$$;

grant execute on function public.get_customer_menu_context(uuid) to anon, authenticated;
