import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { DiningArea, DiningTable, Location, MenuCategory, MenuItem, Order, OrderItem, Organization, Payment, OrderStatus, PaymentMethod } from '../types';

export interface TenantSnapshot {
  organization: Organization;
  location: Location;
  diningAreas: DiningArea[];
  tables: DiningTable[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  payments: Payment[];
}

const statusFlow: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['served'],
  served: ['completed'],
  completed: [],
  cancelled: []
};

// In-memory cache initialized with empty defaults
function createEmptySnapshot(): TenantSnapshot {
  return {
    organization: { id: '', name: '', slug: '' },
    location: { id: '', organizationId: '', name: '', slug: '', city: '', currency: 'INR' },
    diningAreas: [],
    tables: [],
    categories: [],
    menuItems: [],
    orders: [],
    payments: []
  };
}

let localSnapshot: TenantSnapshot = createEmptySnapshot();

export const restaurantService = {
  getTenantSnapshot(): TenantSnapshot {
    return localSnapshot;
  },

  async fetchTenantSnapshot(customLocationId?: string, tableToken?: string): Promise<TenantSnapshot> {
    if (!isSupabaseConfigured || !supabase) {
      return localSnapshot;
    }

    try {
      let orgData: Record<string, any> | null = null;
      let locData: Record<string, any> | null = null;

      let prefetchedTable: DiningTable | null = null;

      if (tableToken) {
        const { data: context, error: contextError } = await supabase.rpc('get_customer_menu_context', {
          table_token: tableToken
        });

        if (contextError || !context?.organization || !context?.location) {
          localSnapshot = createEmptySnapshot();
          return localSnapshot;
        }

        orgData = context.organization;
        locData = context.location;

        if (context.table) {
          prefetchedTable = {
            id: context.table.id,
            locationId: context.table.location_id,
            diningAreaId: context.table.dining_area_id || '',
            tableNumber: context.table.table_number,
            displayName: context.table.display_name,
            capacity: context.table.capacity,
            status: context.table.status,
            publicToken: context.table.public_token
          };
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          localSnapshot = createEmptySnapshot();
          return localSnapshot;
        }

        const { data: membership, error: membershipError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (membershipError || !membership) {
          localSnapshot = createEmptySnapshot();
          return localSnapshot;
        }

        let locationQuery = supabase
          .from('restaurant_locations')
          .select('*')
          .eq('organization_id', membership.organization_id)
          .order('created_at', { ascending: true });

        if (customLocationId) {
          locationQuery = locationQuery.eq('id', customLocationId);
        }

        const [{ data: org }, { data: loc }] = await Promise.all([
          supabase
            .from('organizations')
            .select('*')
            .eq('id', membership.organization_id)
            .maybeSingle(),
          locationQuery.limit(1).maybeSingle()
        ]);

        orgData = org;
        locData = loc;
      }

      if (!orgData || !locData) {
        localSnapshot = createEmptySnapshot();
        return localSnapshot;
      }

      const locationId = customLocationId || locData.id;

      // Fetch dining areas
      const { data: areasData } = await supabase
        .from('dining_areas')
        .select('*')
        .eq('location_id', locationId)
        .order('display_order', { ascending: true });

      // Fetch tables (skip if customer context already loaded the target table)
      const { data: tablesData } = prefetchedTable
        ? { data: null }
        : await supabase
            .from('dining_tables')
            .select('*')
            .eq('location_id', locationId)
            .order('created_at', { ascending: true });

      // Fetch menu categories
      const { data: catData } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('location_id', locationId)
        .order('display_order', { ascending: true });

      // Fetch menu items
      const { data: itemsData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: true });

      // Customer QR pages only need public menu data, not staff order history.
      const includeStaffData = !tableToken;

      const [{ data: ordersData }, { data: paymentsData }] = includeStaffData
        ? await Promise.all([
            supabase
              .from('orders')
              .select('*, order_items(*)')
              .eq('location_id', locationId)
              .order('created_at', { ascending: false }),
            supabase
              .from('payments')
              .select('*')
              .eq('location_id', locationId)
              .order('created_at', { ascending: false })
          ])
        : [{ data: [] }, { data: [] }];

      const mappedOrg: Organization = {
        id: orgData.id,
        name: orgData.name,
        slug: orgData.slug
      };

      const mappedLoc: Location = {
        id: locData.id,
        organizationId: locData.organization_id,
        name: locData.name,
        slug: locData.slug,
        city: locData.city || '',
        currency: locData.currency || 'INR'
      };

      const mappedAreas: DiningArea[] = (areasData || []).map((a) => ({
        id: a.id,
        locationId: a.location_id,
        name: a.name
      }));

      const mappedTables: DiningTable[] = prefetchedTable
        ? [prefetchedTable]
        : (tablesData || []).map((t) => ({
            id: t.id,
            locationId: t.location_id,
            diningAreaId: t.dining_area_id,
            tableNumber: t.table_number,
            displayName: t.display_name || `Table ${t.table_number}`,
            capacity: t.capacity,
            status: t.status,
            publicToken: t.public_token
          }));

      const mappedCategories: MenuCategory[] = (catData || []).map((c) => ({
        id: c.id,
        name: c.name,
        displayOrder: c.display_order
      }));

      const mappedMenuItems: MenuItem[] = (itemsData || []).map((i) => ({
        id: i.id,
        categoryId: i.category_id,
        name: i.name,
        description: i.description || '',
        basePrice: Number(i.base_price),
        taxPercentage: Number(i.tax_percentage || 0),
        foodType: i.food_type || 'vegetarian',
        isAvailable: Boolean(i.is_available),
        imageUrl: i.image_url || undefined
      }));

      const mappedOrders: Order[] = (ordersData || []).map((o) => ({
        id: o.id,
        publicId: o.public_id,
        orderNumber: Number(o.order_number || 0),
        tableId: o.table_id,
        customerName: o.customer_name || 'Guest',
        customerPhone: o.customer_phone || '',
        customerBirthdate: o.customer_birthdate || '',
        orderStatus: o.order_status,
        paymentStatus: o.payment_status,
        subtotal: Number(o.subtotal || 0),
        taxAmount: Number(o.tax_amount || 0),
        totalAmount: Number(o.total_amount || 0),
        createdAt: o.created_at,
        items: (o.order_items || []).map((item: any) => ({
          id: item.id,
          menuItemId: item.menu_item_id,
          itemNameSnapshot: item.item_name_snapshot,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          taxAmount: Number(item.tax_amount),
          totalAmount: Number(item.total_amount),
          notes: item.notes
        }))
      }));

      const mappedPayments: Payment[] = (paymentsData || []).map((p) => ({
        id: p.id,
        orderId: p.order_id,
        amount: Number(p.amount),
        paymentMethod: p.payment_method,
        paidAt: p.paid_at || p.created_at
      }));

      localSnapshot = {
        organization: mappedOrg,
        location: mappedLoc,
        diningAreas: mappedAreas,
        tables: mappedTables,
        categories: mappedCategories,
        menuItems: mappedMenuItems,
        orders: mappedOrders,
        payments: mappedPayments
      };

      return localSnapshot;
    } catch (err) {
      console.error('Error fetching Supabase tenant snapshot:', err);
      localSnapshot = createEmptySnapshot();
      return localSnapshot;
    }
  },

  clearTenantSnapshot() {
    localSnapshot = createEmptySnapshot();
  },

  async createOrganizationWithOwner(
    orgName: string,
    orgSlug: string,
    locationName: string,
    locationSlug: string,
    city: string = 'Delhi'
  ) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured in .env file.');
    }

    const { data, error } = await supabase.rpc('create_organization_with_owner', {
      org_name: orgName,
      org_slug: orgSlug,
      location_name: locationName,
      location_slug: locationSlug,
      city
    });

    if (error) throw error;
    await this.fetchTenantSnapshot();
    return data;
  },

  async createDiningArea(name: string, locationId: string, orgId: string) {
    if (!isSupabaseConfigured || !supabase) {
      const newArea: DiningArea = { id: crypto.randomUUID(), locationId, name };
      localSnapshot.diningAreas.push(newArea);
      return newArea;
    }

    const { data, error } = await supabase
      .from('dining_areas')
      .insert({
        organization_id: orgId,
        location_id: locationId,
        name,
        display_order: localSnapshot.diningAreas.length + 1
      })
      .select()
      .single();

    if (error) throw error;
    await this.fetchTenantSnapshot(locationId);
    return data;
  },

  async createDiningTable(
    tableNumber: string,
    displayName: string,
    capacity: number,
    diningAreaId: string | null,
    locationId: string,
    orgId: string
  ) {
    if (!isSupabaseConfigured || !supabase) {
      const newTable: DiningTable = {
        id: crypto.randomUUID(),
        locationId,
        diningAreaId: diningAreaId || '',
        tableNumber,
        displayName: displayName || `Table ${tableNumber}`,
        capacity,
        status: 'available',
        publicToken: `qr-${tableNumber.toLowerCase()}`
      };
      localSnapshot.tables.push(newTable);
      return newTable;
    }

    const { data, error } = await supabase
      .from('dining_tables')
      .insert({
        organization_id: orgId,
        location_id: locationId,
        dining_area_id: diningAreaId || null,
        table_number: tableNumber,
        display_name: displayName || `Table ${tableNumber}`,
        capacity
      })
      .select()
      .single();

    if (error) throw error;
    await this.fetchTenantSnapshot(locationId);
    return data;
  },

  async createMenuCategory(name: string, locationId: string, orgId: string) {
    if (!isSupabaseConfigured || !supabase) {
      const newCat: MenuCategory = { id: crypto.randomUUID(), name, displayOrder: localSnapshot.categories.length + 1 };
      localSnapshot.categories.push(newCat);
      return newCat;
    }

    const { data, error } = await supabase
      .from('menu_categories')
      .insert({
        organization_id: orgId,
        location_id: locationId,
        name,
        display_order: localSnapshot.categories.length + 1
      })
      .select()
      .single();

    if (error) throw error;
    await this.fetchTenantSnapshot(locationId);
    return data;
  },

  async createMenuItem(item: {
    name: string;
    description?: string;
    basePrice: number;
    taxPercentage: number;
    foodType: 'vegetarian' | 'non_vegetarian' | 'beverage' | 'vegan';
    categoryId: string;
    locationId: string;
    orgId: string;
    imageUrl?: string;
  }) {
    if (!isSupabaseConfigured || !supabase) {
      const newItem: MenuItem = {
        id: crypto.randomUUID(),
        categoryId: item.categoryId,
        name: item.name,
        description: item.description || '',
        basePrice: item.basePrice,
        taxPercentage: item.taxPercentage,
        foodType: item.foodType,
        isAvailable: true
      };
      localSnapshot.menuItems.push(newItem);
      return newItem;
    }

    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        organization_id: item.orgId,
        location_id: item.locationId,
        category_id: item.categoryId,
        name: item.name,
        description: item.description,
        base_price: item.basePrice,
        tax_percentage: item.taxPercentage,
        food_type: item.foodType,
        is_available: true,
        image_url: item.imageUrl || null
      })
      .select()
      .single();

    if (error) throw error;
    await this.fetchTenantSnapshot(item.locationId);
    return data;
  },

  async updateMenuItem(
    itemId: string,
    updates: {
      name: string;
      description?: string;
      basePrice: number;
      taxPercentage: number;
      foodType: 'vegetarian' | 'non_vegetarian' | 'beverage' | 'vegan';
      categoryId: string;
      locationId: string;
      imageUrl?: string;
    }
  ) {
    if (!isSupabaseConfigured || !supabase) {
      const item = localSnapshot.menuItems.find((menuItem) => menuItem.id === itemId);
      if (!item) throw new Error('Menu item not found.');
      item.name = updates.name;
      item.description = updates.description || '';
      item.basePrice = updates.basePrice;
      item.taxPercentage = updates.taxPercentage;
      item.foodType = updates.foodType;
      item.categoryId = updates.categoryId;
      if (updates.imageUrl) item.imageUrl = updates.imageUrl;
      return item;
    }

    const payload: Record<string, any> = {
      category_id: updates.categoryId,
      name: updates.name,
      description: updates.description || '',
      base_price: updates.basePrice,
      tax_percentage: updates.taxPercentage,
      food_type: updates.foodType
    };

    if (updates.imageUrl) {
      payload.image_url = updates.imageUrl;
    }

    const { data, error } = await supabase
      .from('menu_items')
      .update(payload)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    await this.fetchTenantSnapshot(updates.locationId);
    return data;
  },

  async uploadMenuItemImage(file: File, orgId: string): Promise<string> {
    if (!isSupabaseConfigured || !supabase) {
      // Return a local object URL as fallback when Supabase is not configured
      return URL.createObjectURL(file);
    }
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${orgId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from('menu-images')
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(path);
    return urlData.publicUrl;
  },

  async toggleMenuItemAvailability(itemId: string, isAvailable: boolean) {
    if (!isSupabaseConfigured || !supabase) {
      const item = localSnapshot.menuItems.find((i) => i.id === itemId);
      if (item) item.isAvailable = isAvailable;
      return item;
    }

    const { data, error } = await supabase
      .from('menu_items')
      .update({ is_available: isAvailable })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    const locId = localSnapshot.location.id;
    await this.fetchTenantSnapshot(locId);
    return data;
  },

  async createOrder(
    tableToken: string,
    cart: Array<{ itemId: string; quantity: number; notes?: string }>,
    customerName?: string,
    customerPhone?: string,
    customerBirthdate?: string
  ): Promise<Order> {
    if (!isSupabaseConfigured || !supabase) {
      return this.createOrderMock(tableToken, cart, customerName, customerPhone, customerBirthdate);
    }

    try {
      const formattedItems = cart.map((c) => ({
        menu_item_id: c.itemId,
        quantity: c.quantity,
        notes: c.notes || ''
      }));

      // Call public.place_customer_order RPC in Supabase
      const { data: createdOrderId, error } = await supabase.rpc('place_customer_order', {
        table_token: tableToken,
        order_items: formattedItems,
        customer_name: customerName || 'Guest'
      });

      if (error) {
        console.warn('RPC place_customer_order error, falling back:', error.message);
        return this.createOrderMock(tableToken, cart, customerName, customerPhone, customerBirthdate);
      }

      // Fetch created order back from Supabase
      const { data: fetchedOrder } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', createdOrderId)
        .single();

      if (!fetchedOrder) {
        return this.createOrderMock(tableToken, cart, customerName, customerPhone, customerBirthdate);
      }

      const nextOrder: Order = {
        id: fetchedOrder.id,
        publicId: fetchedOrder.public_id,
        orderNumber: Number(fetchedOrder.order_number || 1),
        tableId: fetchedOrder.table_id,
        customerName: fetchedOrder.customer_name || customerName || 'Guest',
        customerPhone: fetchedOrder.customer_phone || customerPhone || '',
        customerBirthdate: fetchedOrder.customer_birthdate || customerBirthdate || '',
        orderStatus: fetchedOrder.order_status,
        paymentStatus: fetchedOrder.payment_status,
        subtotal: Number(fetchedOrder.subtotal || 0),
        taxAmount: Number(fetchedOrder.tax_amount || 0),
        totalAmount: Number(fetchedOrder.total_amount || 0),
        createdAt: fetchedOrder.created_at,
        items: (fetchedOrder.order_items || []).map((i: any) => ({
          id: i.id,
          menuItemId: i.menu_item_id,
          itemNameSnapshot: i.item_name_snapshot,
          quantity: i.quantity,
          unitPrice: Number(i.unit_price),
          taxAmount: Number(i.tax_amount),
          totalAmount: Number(i.total_amount),
          notes: i.notes
        }))
      };

      await this.fetchTenantSnapshot();
      return nextOrder;
    } catch (err) {
      console.error('Failed to create order via Supabase:', err);
      return this.createOrderMock(tableToken, cart, customerName, customerPhone, customerBirthdate);
    }
  },

  createOrderMock(
    tableToken: string,
    cart: Array<{ itemId: string; quantity: number; notes?: string }>,
    customerName?: string,
    customerPhone?: string,
    customerBirthdate?: string
  ): Order {
    const table = localSnapshot.tables.find((item) => item.publicToken === tableToken);
    if (!table) throw new Error('Invalid table QR code.');

    const selectedItems = cart.map((cartItem) => {
      const menuItem = localSnapshot.menuItems.find((item) => item.id === cartItem.itemId && item.isAvailable);
      if (!menuItem) throw new Error('One or more menu items are unavailable.');
      const quantity = Math.max(1, cartItem.quantity);
      const unitTax = Math.round(menuItem.basePrice * (menuItem.taxPercentage / 100));
      return {
        id: crypto.randomUUID(),
        menuItemId: menuItem.id,
        itemNameSnapshot: menuItem.name,
        quantity,
        unitPrice: menuItem.basePrice,
        taxAmount: unitTax * quantity,
        totalAmount: (menuItem.basePrice + unitTax) * quantity,
        notes: cartItem.notes
      };
    });

    const subtotal = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const taxAmount = selectedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const nextOrder: Order = {
      id: crypto.randomUUID(),
      publicId: crypto.randomUUID(),
      orderNumber: 100 + localSnapshot.orders.length + 1,
      tableId: table.id,
      customerName: customerName || 'Guest',
      customerPhone: customerPhone || '',
      customerBirthdate: customerBirthdate || '',
      orderStatus: 'placed',
      paymentStatus: 'pending',
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      createdAt: new Date().toISOString(),
      items: selectedItems
    };

    localSnapshot.orders.unshift(nextOrder);
    table.status = 'occupied';
    return nextOrder;
  },

  async updateOrderItems(
    orderId: string,
    cart: Array<{ itemId: string; quantity: number; notes?: string }>
  ): Promise<Order> {
    if (!cart.length) throw new Error('Add at least one item to update the order.');

    if (!isSupabaseConfigured || !supabase) {
      return this.updateOrderItemsMock(orderId, cart);
    }

    try {
      const formattedItems = cart.map((c) => ({
        menu_item_id: c.itemId,
        quantity: c.quantity,
        notes: c.notes || ''
      }));

      const { error } = await supabase.rpc('update_order_items', {
        target_order_id: orderId,
        order_items: formattedItems
      });

      if (error) throw error;

      await this.fetchTenantSnapshot();
      const updatedOrder = localSnapshot.orders.find((order) => order.id === orderId);
      if (!updatedOrder) throw new Error('Updated order not found.');
      return updatedOrder;
    } catch (err: any) {
      throw new Error(err.message || 'Order update failed.');
    }
  },

  updateOrderItemsMock(orderId: string, cart: Array<{ itemId: string; quantity: number; notes?: string }>): Order {
    const order = localSnapshot.orders.find((item) => item.id === orderId);
    if (!order) throw new Error('Order not found.');
    if (order.paymentStatus === 'paid' || ['completed', 'cancelled'].includes(order.orderStatus)) {
      throw new Error('Only active unpaid orders can be updated.');
    }

    const selectedItems: OrderItem[] = cart.map((cartItem) => {
      const menuItem = localSnapshot.menuItems.find((item) => item.id === cartItem.itemId && item.isAvailable);
      if (!menuItem) throw new Error('One or more menu items are unavailable.');
      const quantity = Math.max(1, cartItem.quantity);
      const unitTax = Math.round(menuItem.basePrice * (menuItem.taxPercentage / 100));
      return {
        id: crypto.randomUUID(),
        menuItemId: menuItem.id,
        itemNameSnapshot: menuItem.name,
        quantity,
        unitPrice: menuItem.basePrice,
        taxAmount: unitTax * quantity,
        totalAmount: (menuItem.basePrice + unitTax) * quantity,
        notes: cartItem.notes
      };
    });

    order.items = selectedItems;
    order.subtotal = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    order.taxAmount = selectedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    order.totalAmount = order.subtotal + order.taxAmount;
    return order;
  },

  async changeOrderStatus(orderId: string, nextStatus: OrderStatus) {
    if (!isSupabaseConfigured || !supabase) {
      return this.changeOrderStatusMock(orderId, nextStatus);
    }

    try {
      const { data, error } = await supabase.rpc('change_order_status', {
        target_order_id: orderId,
        next_status: nextStatus
      });

      if (error) {
        // Fallback to direct table update if RPC access policy fails
        const { data: directData, error: directErr } = await supabase
          .from('orders')
          .update({ order_status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .select()
          .single();

        if (directErr) throw directErr;
      }

      await this.fetchTenantSnapshot();
      return localSnapshot.orders.find((o) => o.id === orderId);
    } catch (err) {
      console.warn('Fallback to mock order status update:', err);
      return this.changeOrderStatusMock(orderId, nextStatus);
    }
  },

  changeOrderStatusMock(orderId: string, nextStatus: OrderStatus) {
    const order = localSnapshot.orders.find((item) => item.id === orderId);
    if (!order) throw new Error('Order not found.');
    if (!statusFlow[order.orderStatus].includes(nextStatus)) {
      throw new Error(`Cannot move order from ${order.orderStatus} to ${nextStatus}.`);
    }
    order.orderStatus = nextStatus;
    return order;
  },

  async recordPayment(orderId: string, method: PaymentMethod) {
    if (!isSupabaseConfigured || !supabase) {
      return this.recordPaymentMock(orderId, method);
    }

    try {
      const order = localSnapshot.orders.find((item) => item.id === orderId);
      const paidAmount = order ? order.totalAmount : 0;

      const { error } = await supabase.rpc('record_payment', {
        target_order_id: orderId,
        method,
        paid_amount: paidAmount
      });

      if (error) {
        // Direct fallback update if RPC fails
        await supabase
          .from('orders')
          .update({ payment_status: 'paid', order_status: 'completed' })
          .eq('id', orderId);

        if (order) {
          await supabase
            .from('payments')
            .insert({
              organization_id: localSnapshot.organization.id,
              location_id: localSnapshot.location.id,
              order_id: orderId,
              payment_method: method,
              amount: paidAmount
            });

          await supabase
            .from('dining_tables')
            .update({ status: 'cleaning' })
            .eq('id', order.tableId);
        }
      }

      await this.fetchTenantSnapshot();
      return localSnapshot.orders.find((o) => o.id === orderId);
    } catch (err) {
      console.warn('Fallback to mock payment record:', err);
      return this.recordPaymentMock(orderId, method);
    }
  },

  recordPaymentMock(orderId: string, method: PaymentMethod) {
    const order = localSnapshot.orders.find((item) => item.id === orderId);
    if (!order) throw new Error('Order not found.');
    if (order.paymentStatus === 'paid') throw new Error('Order is already paid.');
    localSnapshot.payments.unshift({
      id: crypto.randomUUID(),
      orderId,
      amount: order.totalAmount,
      paymentMethod: method,
      paidAt: new Date().toISOString()
    });
    order.paymentStatus = 'paid';
    order.orderStatus = 'completed';
    const table = localSnapshot.tables.find((item) => item.id === order.tableId);
    if (table) table.status = 'cleaning';
    return order;
  },

  async submitDemoRequest(request: {
    name: string;
    restaurantName: string;
    phone: string;
    email: string;
    preferredDate: string;
    preferredTime: string;
  }) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('demo_requests')
        .insert({
          name: request.name,
          restaurant_name: request.restaurantName,
          phone: request.phone,
          email: request.email,
          preferred_date: request.preferredDate,
          preferred_time: request.preferredTime,
        })
        .select()
        .maybeSingle();

      if (!error) {
        return data;
      }
      console.warn('Failed to submit demo request to Supabase, falling back to localStorage:', error);
    }

    // Fallback: localStorage
    const localRequestsStr = localStorage.getItem('dinedesk_demo_requests') || '[]';
    let localRequests = [];
    try {
      localRequests = JSON.parse(localRequestsStr);
    } catch (e) {
      localRequests = [];
    }
    const newRequest = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      ...request,
      created_at: new Date().toISOString()
    };
    localRequests.push(newRequest);
    localStorage.setItem('dinedesk_demo_requests', JSON.stringify(localRequests));
    return newRequest;
  },

  subscribeToOrders(onUpdate: () => void) {
    if (!isSupabaseConfigured || !supabase) return () => {};

    const locationId = localSnapshot.location.id;
    if (!locationId) return () => {};

    const channel = supabase
      .channel(`orders_realtime_${locationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `location_id=eq.${locationId}`
        },
        () => {
          this.fetchTenantSnapshot(locationId).then(() => onUpdate());
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }
};
