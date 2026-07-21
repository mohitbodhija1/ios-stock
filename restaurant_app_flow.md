# Multi-Tenant Restaurant Management App

## 1. Overview

This document describes the proposed architecture and application flow for a scalable, multi-tenant restaurant management platform built with:

- **Frontend:** React.js
- **Backend-as-a-Service:** Supabase
- **Authentication:** Supabase Auth
- **Database:** Supabase PostgreSQL
- **File Storage:** Supabase Storage
- **Realtime Updates:** Supabase Realtime
- **Server-side Logic:** Supabase Edge Functions and PostgreSQL functions

The platform will allow multiple restaurant companies to onboard and manage one or more restaurant locations. Each company can have multiple users, locations, tables, menus, customers, orders, and payments.

---

## 2. Core Business Hierarchy

```text
Platform
└── Organization / Company
    ├── Organization Users
    ├── Restaurant Locations
    │   ├── Location Users
    │   ├── Dining Areas
    │   ├── Tables
    │   ├── Menus
    │   ├── Customers
    │   ├── Orders
    │   ├── Kitchen Stations
    │   └── Payments
    └── Subscription
```

### Important distinction

An **organization** represents the company or restaurant brand.

A **restaurant location** represents a physical branch.

Example:

```text
Organization: Food House Pvt. Ltd.

Locations:
- Food House Delhi
- Food House Gurgaon
- Food House Noida
```

Even if a company initially has only one location, keeping these entities separate will make future expansion easier.

---

## 3. User Types

The application may include the following users:

- Platform administrator
- Organization owner
- Organization administrator
- Branch manager
- Cashier
- Waiter
- Kitchen staff
- Inventory manager
- Accountant
- Customer

Customers do not necessarily need a Supabase Auth account. Guest ordering should be supported.

---

## 4. High-Level Application Flow

```text
Restaurant owner signs up
        ↓
Organization is created
        ↓
First restaurant location is created
        ↓
Owner configures restaurant details
        ↓
Owner invites staff members
        ↓
Owner creates dining areas and tables
        ↓
Owner creates menu categories and items
        ↓
QR codes are generated for tables
        ↓
Customer scans a table QR code
        ↓
Customer views the restaurant menu
        ↓
Customer or waiter creates an order
        ↓
Kitchen receives order items
        ↓
Kitchen updates preparation status
        ↓
Order is served
        ↓
Bill is generated
        ↓
Payment is recorded
        ↓
Order is completed
```

---

# 5. React Application Structure

A recommended React project structure is:

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── layouts/
├── components/
│   ├── common/
│   ├── forms/
│   ├── tables/
│   └── feedback/
├── features/
│   ├── auth/
│   ├── onboarding/
│   ├── organizations/
│   ├── locations/
│   ├── staff/
│   ├── dining/
│   ├── menu/
│   ├── customers/
│   ├── orders/
│   ├── kitchen/
│   ├── payments/
│   └── reports/
├── hooks/
├── lib/
│   ├── supabase.ts
│   ├── permissions.ts
│   └── constants.ts
├── services/
├── store/
├── types/
└── utils/
```

## Recommended frontend libraries

- React Router for routing
- TanStack Query for server-state management
- React Hook Form for forms
- Zod for validation
- Zustand or Redux Toolkit only when global client state is required
- A component library such as Material UI, Ant Design, Chakra UI, or shadcn/ui

Supabase data should normally be handled through TanStack Query rather than storing server data in a global client-side store.

---

# 6. React Application Areas

The system can initially have three frontend experiences.

## 6.1 Restaurant Admin Portal

Used by owners, managers, cashiers, and staff.

Suggested routes:

```text
/login
/signup
/onboarding
/dashboard
/locations
/locations/:locationId
/staff
/tables
/menu
/orders
/kitchen
/customers
/payments
/reports
/settings
```

## 6.2 Customer Ordering App

Used when a customer scans a table QR code.

Suggested routes:

```text
/r/:restaurantSlug
/r/:restaurantSlug/table/:tableToken
/r/:restaurantSlug/menu
/r/:restaurantSlug/cart
/r/:restaurantSlug/order/:orderPublicId
/r/:restaurantSlug/payment
```

## 6.3 Kitchen Display System

Used by kitchen staff.

Suggested routes:

```text
/kitchen
/kitchen/station/:stationId
```

The kitchen view can be part of the same React application and rendered with a separate layout.

---

# 7. Supabase Authentication Flow

Supabase Auth should manage staff authentication.

Supported options may include:

- Email and password
- Magic link
- Google login
- Phone OTP, if needed

## Signup flow

```text
User submits signup form
        ↓
Supabase Auth creates auth.users record
        ↓
Database trigger creates public.profiles record
        ↓
React redirects user to onboarding
        ↓
User creates an organization
        ↓
User becomes organization owner
        ↓
User creates the first restaurant location
```

## Profile table

Supabase stores authentication records inside `auth.users`. Application-specific user information should be stored in a public profile table.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_path text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## Profile creation trigger

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
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
```

---

# 8. Multi-Tenant Data Model

Every business record must be associated with an organization.

The tenant identifier will be:

```text
organization_id
```

Location-specific records will also include:

```text
location_id
```

The frontend must not be trusted to enforce tenant isolation. Supabase Row-Level Security must validate access on every protected table.

---

# 9. Recommended Database Tables

## 9.1 Organizations

```sql
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
```

## 9.2 Organization Members

A user may belong to multiple organizations.

```sql
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
```

Suggested roles:

```text
owner
admin
manager
cashier
waiter
kitchen_staff
inventory_manager
accountant
```

## 9.3 Restaurant Locations

```sql
create table public.restaurant_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  email text,
  phone text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  country text,
  timezone text not null default 'Asia/Kolkata',
  currency text not null default 'INR',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);
```

## 9.4 Location Members

Use this table when users should only access selected branches.

```sql
create table public.location_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.restaurant_locations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  unique (location_id, user_id)
);
```

## 9.5 Dining Areas

```sql
create table public.dining_areas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.restaurant_locations(id) on delete cascade,
  name text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
```

Examples:

- Indoor
- Outdoor
- Rooftop
- First floor
- Private room

## 9.6 Dining Tables

```sql
create table public.dining_tables (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.restaurant_locations(id) on delete cascade,
  dining_area_id uuid references public.dining_areas(id) on delete set null,
  table_number text not null,
  display_name text,
  capacity integer not null default 2,
  status text not null default 'available',
  public_token uuid not null default gen_random_uuid(),
  qr_code_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, table_number),
  unique (public_token)
);
```

Suggested statuses:

```text
available
occupied
reserved
cleaning
inactive
```

## 9.7 Menus

```sql
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.restaurant_locations(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  available_from time,
  available_until time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

A menu with a null `location_id` may be treated as an organization-wide menu. Location-level overrides can be added later if required.

## 9.8 Menu Categories

```sql
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  menu_id uuid not null references public.menus(id) on delete cascade,
  name text not null,
  description text,
  image_path text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

## 9.9 Menu Items

```sql
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text,
  image_path text,
  base_price numeric(12,2) not null,
  tax_percentage numeric(5,2) not null default 0,
  preparation_time_minutes integer,
  food_type text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Possible food types:

```text
vegetarian
non_vegetarian
vegan
egg
beverage
```

## 9.10 Item Variants

```sql
create table public.menu_item_variants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);
```

Examples:

- Small
- Medium
- Large

## 9.11 Modifier Groups

```sql
create table public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  minimum_selection integer not null default 0,
  maximum_selection integer not null default 1,
  created_at timestamptz not null default now()
);
```

## 9.12 Modifier Options

```sql
create table public.modifier_options (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  name text not null,
  additional_price numeric(12,2) not null default 0,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);
```

A many-to-many mapping table should connect menu items and modifier groups.

## 9.13 Customers

```sql
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  auth_user_id uuid references public.profiles(id) on delete set null,
  marketing_consent boolean not null default false,
  loyalty_points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Guest customers may have no `auth_user_id`.

## 9.14 Orders

```sql
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  public_id uuid not null default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  location_id uuid not null references public.restaurant_locations(id),
  table_id uuid references public.dining_tables(id),
  customer_id uuid references public.customers(id),
  order_number bigint generated by default as identity,
  order_type text not null,
  order_status text not null default 'draft',
  payment_status text not null default 'pending',
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  service_charge numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (public_id)
);
```

Order types:

```text
dine_in
takeaway
delivery
online
```

Order statuses:

```text
draft
placed
confirmed
preparing
ready
served
completed
cancelled
```

Payment statuses:

```text
pending
partially_paid
paid
partially_refunded
refunded
failed
```

## 9.15 Order Items

```sql
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id),
  variant_id uuid references public.menu_item_variants(id),
  item_name_snapshot text not null,
  variant_name_snapshot text,
  unit_price numeric(12,2) not null,
  quantity integer not null,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null,
  item_status text not null default 'placed',
  notes text,
  created_at timestamptz not null default now()
);
```

Historical snapshots are important because menu names and prices may change after an order is placed.

## 9.16 Order Item Modifiers

```sql
create table public.order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  modifier_name_snapshot text not null,
  price numeric(12,2) not null default 0
);
```

## 9.17 Kitchen Stations

```sql
create table public.kitchen_stations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.restaurant_locations(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

Examples:

- Main kitchen
- Bar
- Tandoor
- Dessert
- Beverage counter

## 9.18 Payments

```sql
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  location_id uuid not null references public.restaurant_locations(id),
  order_id uuid not null references public.orders(id),
  payment_method text not null,
  amount numeric(12,2) not null,
  status text not null default 'pending',
  external_transaction_id text,
  metadata jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
```

Payment methods may include:

```text
cash
card
upi
wallet
online
store_credit
```

---

# 10. Row-Level Security

Row-Level Security is mandatory for multi-tenant isolation.

## Membership helper function

```sql
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
```

## Example organization policy

```sql
alter table public.organizations enable row level security;

create policy "Members can view their organizations"
on public.organizations
for select
using (public.is_organization_member(id));
```

## Example menu item policy

```sql
alter table public.menu_items enable row level security;

create policy "Members can view menu items"
on public.menu_items
for select
using (public.is_organization_member(organization_id));

create policy "Authorized members can create menu items"
on public.menu_items
for insert
with check (public.is_organization_member(organization_id));
```

The final application should add role checks so that only authorized users can create, update, or delete data.

## Important security rule

Never rely on the following alone:

```javascript
.eq('organization_id', activeOrganizationId)
```

Client-side filters improve query performance and usability, but RLS must enforce the real security boundary.

---

# 11. Permissions Model

Initially, roles may be stored as text values. As permissions become more complex, introduce:

```text
roles
permissions
role_permissions
```

Suggested permissions:

```text
organization.manage
location.manage
staff.view
staff.manage
menu.view
menu.manage
order.view
order.create
order.update
order.cancel
kitchen.view
kitchen.update
payment.create
payment.refund
reports.view
settings.manage
```

React should hide unavailable actions, but Supabase RLS and database functions must also enforce permissions.

---

# 12. Supabase Storage Design

Recommended buckets:

```text
organization-assets
menu-images
a user-avatars
receipts
exports
```

A better final naming structure is:

```text
organization-assets
menu-images
user-avatars
receipts
report-exports
```

Suggested object paths:

```text
organization-assets/{organization_id}/logo.png
menu-images/{organization_id}/{menu_item_id}/main.jpg
user-avatars/{user_id}/avatar.jpg
receipts/{organization_id}/{location_id}/{order_id}.pdf
report-exports/{organization_id}/{export_id}.csv
```

Storage policies should validate that authenticated users belong to the organization identified in the storage path.

Public menu images can be stored in a public bucket. Sensitive documents such as receipts and exports should use private buckets and signed URLs.

---

# 13. Restaurant Onboarding Flow

## Step 1: User signup

The owner creates an account using Supabase Auth.

## Step 2: Organization creation

The React application calls a database function or Edge Function that:

1. Creates the organization.
2. Creates the owner membership.
3. Optionally creates a default subscription record.
4. Returns the organization ID.

These steps should happen in one transaction.

## Step 3: Location setup

The owner enters:

- Restaurant name
- Branch name
- Contact details
- Address
- Timezone
- Currency
- Tax configuration
- Opening hours

## Step 4: Staff invitations

The owner invites users using email addresses.

A `staff_invitations` table may contain:

```text
id
organization_id
location_id
email
role
token
expires_at
accepted_at
invited_by
```

An Edge Function can send the invitation email.

## Step 5: Table setup

The owner creates dining areas and tables.

For every table:

1. Generate a public token.
2. Generate a customer-facing URL.
3. Generate a QR code.
4. Save the generated QR code in Supabase Storage.

Example customer URL:

```text
https://app.example.com/r/food-house/table/5e56780f-7ffc-4c9d-a31e-328983892be1
```

## Step 6: Menu setup

The owner creates:

1. Menu
2. Categories
3. Menu items
4. Variants
5. Modifier groups
6. Modifier options
7. Images
8. Availability rules

## Step 7: Launch

The owner activates the location and menu. Customers can now scan table QR codes and place orders.

---

# 14. Customer QR Ordering Flow

```text
Customer scans QR code
        ↓
React reads restaurant slug and table public token
        ↓
Application fetches public restaurant and table information
        ↓
Application fetches active public menu
        ↓
Customer adds items to cart
        ↓
Customer selects variants and modifiers
        ↓
Customer provides optional name and phone
        ↓
Customer submits order
        ↓
Secure database function validates prices and availability
        ↓
Order and order items are created in one transaction
        ↓
Kitchen receives realtime update
        ↓
Customer sees live order status
```

## Important pricing rule

The browser must never be allowed to decide the final payable amount.

When placing an order, the frontend should submit only:

```text
menu item IDs
variant IDs
modifier option IDs
quantities
customer notes
table public token
```

A PostgreSQL function or Supabase Edge Function should:

1. Load current menu prices.
2. Confirm item availability.
3. Calculate subtotal.
4. Calculate tax.
5. Calculate discounts and charges.
6. Create the order.
7. Create order items and modifier snapshots.
8. Return the final order summary.

---

# 15. Waiter Order Flow

```text
Waiter signs in
        ↓
Waiter selects a restaurant location
        ↓
Waiter views table status
        ↓
Waiter selects an available or occupied table
        ↓
Waiter creates or opens an active order
        ↓
Waiter adds menu items
        ↓
Order is submitted to kitchen
        ↓
Table status becomes occupied
```

A table may have one active dining session containing multiple order submissions.

For this reason, a future version may introduce:

```text
dining_sessions
```

Suggested fields:

```text
id
organization_id
location_id
table_id
customer_id
status
opened_at
closed_at
opened_by
```

Orders can then belong to a dining session.

---

# 16. Kitchen Flow

```text
Placed order is created
        ↓
Supabase Realtime publishes database change
        ↓
Kitchen screen receives new order
        ↓
Kitchen accepts the order
        ↓
Order status becomes confirmed
        ↓
Items move to preparing
        ↓
Items move to ready
        ↓
Waiter receives realtime notification
        ↓
Items are served
```

For larger restaurants, menu items should be mapped to kitchen stations.

Example:

```text
Cold coffee → Beverage station
Paneer tikka → Tandoor station
Brownie → Dessert station
```

The kitchen screen should subscribe only to the current location and, when applicable, the selected station.

---

# 17. Billing and Payment Flow

```text
Customer requests bill
        ↓
Application loads active dining session or order
        ↓
Server recalculates final totals
        ↓
Discounts and charges are applied
        ↓
Bill is displayed
        ↓
Cashier selects payment method
        ↓
Payment record is created
        ↓
Payment is confirmed
        ↓
Order payment status becomes paid
        ↓
Order status becomes completed
        ↓
Table becomes cleaning or available
```

Keep order status and payment status separate.

Examples:

```text
order_status = completed
payment_status = pending
```

or:

```text
order_status = cancelled
payment_status = partially_refunded
```

Support multiple payment records for split payments.

---

# 18. Supabase Realtime Usage

Recommended realtime subscriptions:

## Kitchen screen

Subscribe to:

```text
orders
order_items
```

Filters should be based on `location_id`.

## Waiter dashboard

Subscribe to:

```text
orders
order_items
dining_tables
```

## Customer order status

Subscribe to the specific order using `public_id` or another safe public identifier.

## Important consideration

Do not expose internal sequential order numbers or unrestricted order records to unauthenticated customers.

Public customer access should use narrowly scoped database functions, secure views, or an Edge Function.

---

# 19. Edge Functions

Supabase Edge Functions are recommended for operations that require server-side secrets or external integrations.

Possible functions:

```text
create-organization
invite-staff
accept-staff-invitation
create-public-order
create-payment-intent
verify-payment
send-order-notification
generate-receipt
generate-table-qr
```

Use database functions for transactional data logic close to PostgreSQL. Use Edge Functions for external APIs, secret keys, email providers, payment gateways, and file generation.

---

# 20. Database Functions

Recommended PostgreSQL functions:

```text
create_organization_with_owner
place_customer_order
place_staff_order
recalculate_order_totals
change_order_status
record_payment
close_dining_session
cancel_order
```

These functions should validate:

- Tenant membership
- User permissions
- Location access
- Menu availability
- Price integrity
- Valid state transitions
- Payment totals

---

# 21. State Transition Rules

Order states should follow controlled transitions.

```text
draft
  ↓
placed
  ↓
confirmed
  ↓
preparing
  ↓
ready
  ↓
served
  ↓
completed
```

Cancellation may be allowed from selected states:

```text
draft → cancelled
placed → cancelled
confirmed → cancelled
```

Once preparation has started, cancellation may require manager permission.

The database should enforce these rules instead of allowing arbitrary status updates from React.

---

# 22. Audit Logging

Create an audit log for sensitive actions.

```sql
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
```

Audit actions such as:

- Menu price changes
- Order cancellation
- Refunds
- Staff role changes
- Tax changes
- Manual discounts
- Payment deletion or correction

---

# 23. Indexes

Recommended indexes:

```sql
create index organization_members_user_idx
on public.organization_members(user_id, status);

create index restaurant_locations_org_idx
on public.restaurant_locations(organization_id);

create index dining_tables_location_idx
on public.dining_tables(location_id, status);

create index menu_items_org_category_idx
on public.menu_items(organization_id, category_id, is_available);

create index orders_location_created_idx
on public.orders(location_id, created_at desc);

create index orders_org_status_idx
on public.orders(organization_id, order_status);

create index order_items_order_idx
on public.order_items(order_id);

create index payments_order_idx
on public.payments(order_id);
```

---

# 24. React Data Access Pattern

Create one configured Supabase client.

```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

Do not expose the Supabase service-role key in the React application.

Use feature-specific service files:

```text
features/menu/api/menuApi.ts
features/orders/api/orderApi.ts
features/auth/api/authApi.ts
```

Example query:

```javascript
export async function getMenuItems(organizationId, categoryId) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('category_id', categoryId)
    .eq('is_available', true)
    .order('name');

  if (error) throw error;
  return data;
}
```

RLS still remains responsible for access control.

---

# 25. Active Organization and Location Context

After login, the React application should load all organizations available to the user.

```text
Authenticated user
        ↓
Fetch organization memberships
        ↓
Select active organization
        ↓
Fetch accessible locations
        ↓
Select active location
        ↓
Load role and permissions
        ↓
Render application
```

The active organization and location may be stored in:

- React context
- Zustand store
- URL parameters
- Local storage for user convenience

The URL should preferably include the active organization or location where practical.

Example:

```text
/app/:organizationSlug/:locationSlug/orders
```

The saved active tenant is only a UI preference. RLS remains the authorization layer.

---

# 26. Error Handling

The React app should have a standard error format.

```text
code
message
field_errors
request_id
```

Common errors:

- User does not belong to the organization
- Location access denied
- Menu item unavailable
- Invalid table token
- Order already completed
- Invalid order status transition
- Payment amount exceeds balance
- Duplicate payment callback

Display safe messages to users and keep internal details in logs.

---

# 27. MVP Scope

The first release should include:

1. Supabase authentication
2. Organization onboarding
3. Restaurant location management
4. User invitation and basic roles
5. Dining area and table management
6. Table QR-code generation
7. Menu category and item management
8. Customer menu view
9. Customer or waiter order creation
10. Kitchen order screen
11. Order status updates
12. Billing and manual payment recording
13. Basic sales reports
14. Supabase Storage for menu images and logos
15. RLS policies for tenant isolation

---

# 28. Features for Later Phases

## Phase 2

- Dining sessions
- Reservations
- Waitlist
- Coupons and promotions
- Online payment integration
- Receipt generation
- Customer feedback
- Loyalty points
- Notifications

## Phase 3

- Inventory management
- Recipes and ingredient consumption
- Supplier management
- Purchase orders
- Staff shifts and attendance
- Advanced analytics
- Accounting integrations
- Delivery management
- Multi-language menus
- Subscription billing for organizations

---

# 29. Recommended Implementation Order

## Milestone 1: Foundation

- Create React project
- Create Supabase project
- Configure environment variables
- Configure authentication
- Create profile trigger
- Create organization and membership tables
- Add RLS policies

## Milestone 2: Restaurant Setup

- Location management
- Dining areas
- Tables
- Supabase Storage buckets
- QR code generation

## Milestone 3: Menu

- Menus
- Categories
- Menu items
- Variants
- Modifiers
- Menu image upload
- Public customer menu

## Milestone 4: Orders

- Cart
- Secure order creation function
- Order item snapshots
- Waiter order interface
- Table status updates

## Milestone 5: Kitchen

- Kitchen dashboard
- Realtime subscriptions
- Controlled order transitions
- Station filtering

## Milestone 6: Billing

- Bill calculation
- Payment records
- Split payments
- Order completion
- Basic receipts

## Milestone 7: Reporting and Hardening

- Daily sales report
- Staff activity logs
- Audit logs
- Index optimization
- RLS security tests
- Error monitoring

---

# 30. Key Architecture Decisions

1. Use a shared Supabase PostgreSQL database with `organization_id` for multi-tenancy.
2. Use RLS on every tenant-owned table.
3. Separate organizations from physical restaurant locations.
4. Allow users to belong to multiple organizations and locations.
5. Treat React as an untrusted client.
6. Calculate order totals on the server.
7. Store historical order item and modifier snapshots.
8. Keep order status and payment status separate.
9. Use Supabase Realtime for kitchen, waiter, and customer order updates.
10. Use Edge Functions only when server secrets or external services are required.
11. Start as a modular application rather than prematurely splitting into microservices.
12. Introduce advanced features only after the core ordering flow is stable.

---

# 31. Initial End-to-End MVP Flow

```text
Owner signs up through Supabase Auth
        ↓
Profile is created automatically
        ↓
Owner creates organization
        ↓
Owner creates restaurant location
        ↓
Owner invites staff
        ↓
Owner creates dining areas and tables
        ↓
System generates table QR codes
        ↓
Owner creates menu
        ↓
Customer scans QR code
        ↓
Customer views menu and submits order
        ↓
Server validates prices and creates order
        ↓
Kitchen receives order through Supabase Realtime
        ↓
Kitchen prepares and marks order ready
        ↓
Waiter serves order
        ↓
Cashier records payment
        ↓
Order is completed
        ↓
Table is made available
        ↓
Sales report is updated
```

---

# 32. Next Design Documents

After this flow is approved, the next useful documents would be:

- Detailed Entity Relationship Diagram
- Complete Supabase migration scripts
- Complete RLS policy matrix
- React page and component map
- API and database-function contracts
- Order state machine
- Permission matrix
- MVP sprint plan
