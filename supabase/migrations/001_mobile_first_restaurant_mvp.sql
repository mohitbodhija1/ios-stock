create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_path text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  email text,
  phone text,
  logo_path text,
  status text not null default 'active',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'cashier', 'waiter', 'kitchen_staff')),
  status text not null default 'active',
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.restaurant_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  email text,
  phone text,
  address_line_1 text,
  city text,
  state text,
  postal_code text,
  country text not null default 'India',
  timezone text not null default 'Asia/Kolkata',
  currency text not null default 'INR',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.location_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.restaurant_locations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'cashier', 'waiter', 'kitchen_staff')),
  created_at timestamptz not null default now(),
  unique (location_id, user_id)
);

create table public.dining_areas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.restaurant_locations(id) on delete cascade,
  name text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.dining_tables (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.restaurant_locations(id) on delete cascade,
  dining_area_id uuid references public.dining_areas(id) on delete set null,
  table_number text not null,
  display_name text,
  capacity integer not null default 2,
  status text not null default 'available' check (status in ('available', 'occupied', 'cleaning', 'inactive')),
  public_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, table_number),
  unique (public_token)
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.restaurant_locations(id) on delete cascade,
  name text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.restaurant_locations(id) on delete cascade,
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text,
  image_path text,
  base_price numeric(12,2) not null check (base_price >= 0),
  tax_percentage numeric(5,2) not null default 0,
  food_type text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  public_id uuid not null default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  location_id uuid not null references public.restaurant_locations(id),
  table_id uuid references public.dining_tables(id),
  order_number bigint generated by default as identity,
  order_status text not null default 'placed' check (order_status in ('placed', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  notes text,
  customer_name text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (public_id)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id),
  item_name_snapshot text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  location_id uuid not null references public.restaurant_locations(id),
  order_id uuid not null references public.orders(id),
  payment_method text not null check (payment_method in ('cash', 'card', 'upi')),
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'paid',
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  location_id uuid references public.restaurant_locations(id),
  user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  );
$$;

create or replace function public.has_location_access(target_location_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.location_members lm
    where lm.location_id = target_location_id
      and lm.user_id = auth.uid()
  );
$$;

create or replace function public.create_organization_with_owner(
  org_name text,
  org_slug text,
  location_name text,
  location_slug text,
  city text default null
)
returns table (organization_id uuid, location_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  new_location_id uuid;
begin
  insert into public.organizations (name, slug, created_by)
  values (org_name, org_slug, auth.uid())
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'owner');

  insert into public.restaurant_locations (organization_id, name, slug, city)
  values (new_org_id, location_name, location_slug, city)
  returning id into new_location_id;

  insert into public.location_members (organization_id, location_id, user_id, role)
  values (new_org_id, new_location_id, auth.uid(), 'owner');

  return query select new_org_id, new_location_id;
end;
$$;

create or replace function public.place_customer_order(
  table_token uuid,
  order_items jsonb,
  customer_name text default null,
  notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_table public.dining_tables%rowtype;
  created_order_id uuid;
  item jsonb;
  menu_item public.menu_items%rowtype;
  qty integer;
  line_tax numeric(12,2);
  line_total numeric(12,2);
  subtotal_value numeric(12,2) := 0;
  tax_value numeric(12,2) := 0;
begin
  select * into target_table from public.dining_tables where public_token = table_token and status <> 'inactive';
  if not found then
    raise exception 'invalid_table_token';
  end if;

  insert into public.orders (organization_id, location_id, table_id, customer_name, notes)
  values (target_table.organization_id, target_table.location_id, target_table.id, customer_name, notes)
  returning id into created_order_id;

  for item in select * from jsonb_array_elements(order_items)
  loop
    qty := greatest((item ->> 'quantity')::integer, 1);

    select * into menu_item
    from public.menu_items
    where id = (item ->> 'menu_item_id')::uuid
      and organization_id = target_table.organization_id
      and location_id = target_table.location_id
      and is_available = true;

    if not found then
      raise exception 'menu_item_unavailable';
    end if;

    line_tax := round(menu_item.base_price * (menu_item.tax_percentage / 100) * qty, 2);
    line_total := round((menu_item.base_price * qty) + line_tax, 2);
    subtotal_value := subtotal_value + (menu_item.base_price * qty);
    tax_value := tax_value + line_tax;

    insert into public.order_items (
      organization_id,
      order_id,
      menu_item_id,
      item_name_snapshot,
      unit_price,
      quantity,
      tax_amount,
      total_amount,
      notes
    )
    values (
      target_table.organization_id,
      created_order_id,
      menu_item.id,
      menu_item.name,
      menu_item.base_price,
      qty,
      line_tax,
      line_total,
      item ->> 'notes'
    );
  end loop;

  update public.orders
  set subtotal = subtotal_value,
      tax_amount = tax_value,
      total_amount = subtotal_value + tax_value
  where id = created_order_id;

  update public.dining_tables set status = 'occupied' where id = target_table.id;
  return created_order_id;
end;
$$;

create or replace function public.change_order_status(target_order_id uuid, next_status text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
begin
  select * into target_order from public.orders where id = target_order_id;
  if not found or not public.is_organization_member(target_order.organization_id) then
    raise exception 'order_access_denied';
  end if;

  if not (
    (target_order.order_status = 'placed' and next_status in ('confirmed', 'cancelled')) or
    (target_order.order_status = 'confirmed' and next_status in ('preparing', 'cancelled')) or
    (target_order.order_status = 'preparing' and next_status = 'ready') or
    (target_order.order_status = 'ready' and next_status = 'served') or
    (target_order.order_status = 'served' and next_status = 'completed')
  ) then
    raise exception 'invalid_order_status_transition';
  end if;

  update public.orders set order_status = next_status, updated_at = now() where id = target_order_id returning * into target_order;
  return target_order;
end;
$$;

create or replace function public.record_payment(target_order_id uuid, method text, paid_amount numeric)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
begin
  select * into target_order from public.orders where id = target_order_id;
  if not found or not public.is_organization_member(target_order.organization_id) then
    raise exception 'order_access_denied';
  end if;

  if target_order.payment_status = 'paid' then
    raise exception 'order_already_paid';
  end if;

  if paid_amount <> target_order.total_amount then
    raise exception 'payment_amount_mismatch';
  end if;

  insert into public.payments (organization_id, location_id, order_id, payment_method, amount)
  values (target_order.organization_id, target_order.location_id, target_order.id, method, paid_amount);

  update public.orders
  set payment_status = 'paid',
      order_status = 'completed',
      updated_at = now()
  where id = target_order.id
  returning * into target_order;

  update public.dining_tables set status = 'cleaning' where id = target_order.table_id;
  return target_order;
end;
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.restaurant_locations enable row level security;
alter table public.location_members enable row level security;
alter table public.dining_areas enable row level security;
alter table public.dining_tables enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users can view own profile" on public.profiles for select using (id = auth.uid());
create policy "Users can update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Members can view organizations" on public.organizations for select using (public.is_organization_member(id));
create policy "Members can view organization memberships" on public.organization_members for select using (public.is_organization_member(organization_id));
create policy "Members can view locations" on public.restaurant_locations for select using (public.is_organization_member(organization_id));
create policy "Members can view location memberships" on public.location_members for select using (public.is_organization_member(organization_id));

create policy "Members can manage dining areas" on public.dining_areas for all using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members can manage dining tables" on public.dining_tables for all using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members can manage menu categories" on public.menu_categories for all using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members can manage menu items" on public.menu_items for all using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members can view orders" on public.orders for select using (public.is_organization_member(organization_id));
create policy "Members can view order items" on public.order_items for select using (public.is_organization_member(organization_id));
create policy "Members can view payments" on public.payments for select using (public.is_organization_member(organization_id));
create policy "Members can view audit logs" on public.audit_logs for select using (public.is_organization_member(organization_id));

create policy "Public can view active menu categories" on public.menu_categories for select using (is_active = true);
create policy "Public can view available menu items" on public.menu_items for select using (is_available = true);
create policy "Public can resolve active QR tables" on public.dining_tables for select using (status <> 'inactive');

create index organization_members_user_idx on public.organization_members(user_id, status);
create index restaurant_locations_org_idx on public.restaurant_locations(organization_id);
create index dining_tables_location_idx on public.dining_tables(location_id, status);
create index menu_items_location_category_idx on public.menu_items(location_id, category_id, is_available);
create index orders_location_created_idx on public.orders(location_id, created_at desc);
create index orders_org_status_idx on public.orders(organization_id, order_status);
create index order_items_order_idx on public.order_items(order_id);
create index payments_order_idx on public.payments(order_id);

create view public.daily_sales_report as
select
  organization_id,
  location_id,
  date_trunc('day', created_at) as sales_day,
  count(*) filter (where payment_status = 'paid') as paid_orders,
  count(*) filter (where order_status = 'cancelled') as cancelled_orders,
  coalesce(sum(total_amount) filter (where payment_status = 'paid'), 0) as revenue
from public.orders
group by organization_id, location_id, date_trunc('day', created_at);
