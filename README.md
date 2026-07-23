# Mobile-First Restaurant MVP

React + Supabase PWA for the restaurant MVP flow: setup, table QR ordering, waiter orders, kitchen display, manual billing, and daily reports.

## Run Locally

```bash
npm install
npm run dev
```

The app runs in demo mode until `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided.

## Supabase

Apply migrations in `supabase/migrations/` (in order) to create the MVP schema, RLS policies, order/payment functions, platform admin support, and tenant isolation.

## Platform Admin Setup

1. Apply migration `007_platform_admin.sql`.
2. Sign up a user in the app (or create one in Supabase Auth).
3. In the Supabase SQL editor, promote that user:

```sql
select public.promote_to_platform_admin('admin@yourdomain.com');
```

4. Sign in at `/admin` or use **Platform Admin** in the site footer.

From the admin portal you can:
- Onboard new restaurants (organization + first branch)
- Assign an owner by email (owner must register first if they don't have an account)
- View all onboarded restaurants

Restaurant self-service onboarding is disabled — only platform admins can create new organizations.

## Key Routes

- `/` landing page
- `/admin` platform admin portal (onboard restaurants)
- `/app` staff dashboard
- `/setup` location, dining area, and table QR setup
- `/menu` menu management
- `/order` table ordering
- `/kitchen` kitchen display
- `/billing` manual payments
- `/history` order history
- `/reports` daily sales
- `/r/food-house/table/qr-table-1` customer QR ordering demo
