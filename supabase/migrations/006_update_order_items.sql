create or replace function public.update_order_items(target_order_id uuid, order_items jsonb)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
  item jsonb;
  menu public.menu_items%rowtype;
  item_quantity integer;
  line_subtotal numeric(12,2);
  line_tax numeric(12,2);
  line_total numeric(12,2);
  subtotal_acc numeric(12,2) := 0;
  tax_acc numeric(12,2) := 0;
begin
  select * into target_order from public.orders where id = target_order_id;

  if not found or not public.is_organization_member(target_order.organization_id) then
    raise exception 'order_access_denied';
  end if;

  if target_order.payment_status = 'paid' or target_order.order_status in ('completed', 'cancelled') then
    raise exception 'order_not_editable';
  end if;

  if jsonb_array_length(order_items) = 0 then
    raise exception 'order_requires_items';
  end if;

  delete from public.order_items where order_id = target_order.id;

  for item in select * from jsonb_array_elements(order_items)
  loop
    select * into menu
    from public.menu_items
    where id = (item->>'menu_item_id')::uuid
      and location_id = target_order.location_id
      and is_available = true;

    if not found then
      raise exception 'menu_item_unavailable';
    end if;

    item_quantity := greatest(1, (item->>'quantity')::integer);
    line_subtotal := menu.base_price * item_quantity;
    line_tax := round(line_subtotal * (menu.tax_percentage / 100), 2);
    line_total := line_subtotal + line_tax;

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
      target_order.organization_id,
      target_order.id,
      menu.id,
      menu.name,
      menu.base_price,
      item_quantity,
      line_tax,
      line_total,
      nullif(item->>'notes', '')
    );

    subtotal_acc := subtotal_acc + line_subtotal;
    tax_acc := tax_acc + line_tax;
  end loop;

  update public.orders
  set subtotal = subtotal_acc,
      tax_amount = tax_acc,
      total_amount = subtotal_acc + tax_acc,
      updated_at = now()
  where id = target_order.id
  returning * into target_order;

  return target_order;
end;
$$;
