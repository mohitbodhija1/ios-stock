create table public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  restaurant_name text not null,
  phone text not null,
  email text not null,
  preferred_date date not null,
  preferred_time text not null,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.demo_requests enable row level security;

-- Create policy to allow public inserts
create policy "Allow public inserts" on public.demo_requests for insert with check (true);

-- Create policy to allow authenticated reads
create policy "Allow authenticated view" on public.demo_requests for select using (true);
