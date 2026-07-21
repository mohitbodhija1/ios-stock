# Mobile-First Restaurant MVP

React + Supabase PWA for the restaurant MVP flow: setup, table QR ordering, waiter orders, kitchen display, manual billing, and daily reports.

## Run Locally

```bash
npm install
npm run dev
```

The app runs in demo mode until `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided.

## Supabase

Apply the migration in `supabase/migrations/001_mobile_first_restaurant_mvp.sql` to create the MVP schema, RLS policies, order/payment functions, indexes, and daily sales report view.

## Key Routes

- `/` staff dashboard
- `/setup` location, dining area, and table QR setup
- `/menu` menu management
- `/waiter` waiter table ordering
- `/kitchen` kitchen display
- `/billing` manual payments
- `/reports` daily sales
- `/r/food-house/table/qr-table-1` customer QR ordering demo
