-- Admin user listing and assignment by user id

create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'platform_admin_required';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.full_name,
    p.created_at
  from public.profiles p
  inner join auth.users u on u.id = p.id
  order by coalesce(p.full_name, u.email) asc;
end;
$$;

create or replace function public.admin_onboard_restaurant(
  org_name text,
  org_slug text,
  location_name text,
  location_slug text,
  city text default null,
  owner_email text default null,
  org_email text default null,
  org_phone text default null,
  selected_owner_user_id uuid default null
)
returns table (
  organization_id uuid,
  location_id uuid,
  owner_user_id uuid,
  owner_assigned boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_org_id uuid;
  new_location_id uuid;
  resolved_owner_id uuid;
  creator_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'platform_admin_required';
  end if;

  if selected_owner_user_id is not null then
    if not exists (select 1 from public.profiles where id = selected_owner_user_id) then
      raise exception 'owner_user_not_found';
    end if;
    resolved_owner_id := selected_owner_user_id;
  elsif owner_email is not null and trim(owner_email) <> '' then
    resolved_owner_id := public.get_user_id_by_email(owner_email);
  end if;

  creator_id := coalesce(resolved_owner_id, auth.uid());

  insert into public.organizations (name, slug, email, phone, created_by)
  values (org_name, org_slug, org_email, org_phone, creator_id)
  returning id into new_org_id;

  insert into public.restaurant_locations (organization_id, name, slug, city)
  values (new_org_id, location_name, location_slug, city)
  returning id into new_location_id;

  if resolved_owner_id is not null then
    insert into public.organization_members (organization_id, user_id, role, invited_by)
    values (new_org_id, resolved_owner_id, 'owner', auth.uid());

    insert into public.location_members (organization_id, location_id, user_id, role)
    values (new_org_id, new_location_id, resolved_owner_id, 'owner');

    return query select new_org_id, new_location_id, resolved_owner_id, true;
  end if;

  return query select new_org_id, new_location_id, null::uuid, false;
end;
$$;

create or replace function public.admin_assign_owner_by_user_id(
  target_org_id uuid,
  owner_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_location_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'platform_admin_required';
  end if;

  if owner_user_id is null then
    raise exception 'owner_user_id_required';
  end if;

  if not exists (select 1 from public.profiles where id = owner_user_id) then
    raise exception 'owner_user_not_found';
  end if;

  if not exists (select 1 from public.organizations where id = target_org_id) then
    raise exception 'organization_not_found';
  end if;

  insert into public.organization_members (organization_id, user_id, role, invited_by)
  values (target_org_id, owner_user_id, 'owner', auth.uid())
  on conflict (organization_id, user_id) do update set role = 'owner', status = 'active';

  select id into target_location_id
  from public.restaurant_locations
  where organization_id = target_org_id
  order by created_at asc
  limit 1;

  if target_location_id is not null then
    insert into public.location_members (organization_id, location_id, user_id, role)
    values (target_org_id, target_location_id, owner_user_id, 'owner')
    on conflict (location_id, user_id) do update set role = 'owner';
  end if;

  update public.organizations
  set created_by = owner_user_id, updated_at = now()
  where id = target_org_id;

  return owner_user_id;
end;
$$;

grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_assign_owner_by_user_id(uuid, uuid) to authenticated;
grant execute on function public.admin_onboard_restaurant(
  text, text, text, text, text, text, text, text, uuid
) to authenticated;
