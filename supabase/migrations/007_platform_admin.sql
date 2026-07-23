-- Platform administrator support for onboarding restaurants

create table public.platform_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
  );
$$;

create policy "Platform admins can view admin list"
on public.platform_admins
for select
using (public.is_platform_admin());

create or replace function public.get_user_id_by_email(target_email text)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(trim(target_email)) limit 1;
$$;

create or replace function public.admin_onboard_restaurant(
  org_name text,
  org_slug text,
  location_name text,
  location_slug text,
  city text default null,
  owner_email text default null,
  org_email text default null,
  org_phone text default null
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

  if owner_email is not null and trim(owner_email) <> '' then
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
  target_location_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'platform_admin_required';
  end if;

  if owner_email is null or trim(owner_email) = '' then
    raise exception 'owner_email_required';
  end if;

  resolved_owner_id := public.get_user_id_by_email(owner_email);
  if resolved_owner_id is null then
    raise exception 'owner_user_not_found';
  end if;

  if not exists (select 1 from public.organizations where id = target_org_id) then
    raise exception 'organization_not_found';
  end if;

  insert into public.organization_members (organization_id, user_id, role, invited_by)
  values (target_org_id, resolved_owner_id, 'owner', auth.uid())
  on conflict (organization_id, user_id) do update set role = 'owner', status = 'active';

  select id into target_location_id
  from public.restaurant_locations
  where organization_id = target_org_id
  order by created_at asc
  limit 1;

  if target_location_id is not null then
    insert into public.location_members (organization_id, location_id, user_id, role)
    values (target_org_id, target_location_id, resolved_owner_id, 'owner')
    on conflict (location_id, user_id) do update set role = 'owner';
  end if;

  update public.organizations
  set created_by = resolved_owner_id, updated_at = now()
  where id = target_org_id;

  return resolved_owner_id;
end;
$$;

-- Platform admins can read all tenant data for management
create policy "Platform admins can view all organizations"
on public.organizations
for select
using (public.is_platform_admin());

create policy "Platform admins can view all locations"
on public.restaurant_locations
for select
using (public.is_platform_admin());

create policy "Platform admins can view all org members"
on public.organization_members
for select
using (public.is_platform_admin());

create policy "Platform admins can view all location members"
on public.location_members
for select
using (public.is_platform_admin());

create policy "Platform admins can view all profiles"
on public.profiles
for select
using (public.is_platform_admin());

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.admin_onboard_restaurant(
  text, text, text, text, text, text, text, text
) to authenticated;
grant execute on function public.admin_assign_owner(uuid, text) to authenticated;

-- Run once from Supabase SQL editor (service role) after creating the admin auth user:
-- select public.promote_to_platform_admin('admin@yourdomain.com');
create or replace function public.promote_to_platform_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
  select id into target_user_id
  from auth.users
  where lower(email) = lower(trim(target_email));

  if target_user_id is null then
    raise exception 'user_not_found: %', target_email;
  end if;

  insert into public.platform_admins (user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;
end;
$$;
