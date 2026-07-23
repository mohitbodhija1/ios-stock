-- Support multiple owners per restaurant

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
  existing_owner_count integer;
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

  if exists (
    select 1
    from public.organization_members
    where organization_id = target_org_id
      and user_id = owner_user_id
      and role = 'owner'
      and status = 'active'
  ) then
    raise exception 'owner_already_assigned';
  end if;

  select count(*) into existing_owner_count
  from public.organization_members
  where organization_id = target_org_id
    and role = 'owner'
    and status = 'active';

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

  if existing_owner_count = 0 then
    update public.organizations
    set created_by = owner_user_id, updated_at = now()
    where id = target_org_id;
  end if;

  return owner_user_id;
end;
$$;

create or replace function public.admin_assign_owner(
  target_org_id uuid,
  owner_email text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  resolved_owner_id uuid;
begin
  if owner_email is null or trim(owner_email) = '' then
    raise exception 'owner_email_required';
  end if;

  resolved_owner_id := public.get_user_id_by_email(owner_email);
  if resolved_owner_id is null then
    raise exception 'owner_user_not_found';
  end if;

  return public.admin_assign_owner_by_user_id(target_org_id, resolved_owner_id);
end;
$$;
