-- Ensure publication exists
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Set replica identity to full to broadcast full row content on change
alter table public.orders replica identity full;
alter table public.order_items replica identity full;
alter table public.dining_tables replica identity full;

-- Add tables to the supabase_realtime publication
do $$
begin
  alter publication supabase_realtime add table public.orders, public.order_items, public.dining_tables;
exception
  when duplicate_object then
    null; -- Ignore if already added
end $$;
