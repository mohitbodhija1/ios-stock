import { categories, diningAreas, location, menuItems, orders, organization, payments, tables } from '../lib/mockData';
import type { MenuItem, Order, OrderStatus, PaymentMethod } from '../types';

const statusFlow: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['served'],
  served: ['completed'],
  completed: [],
  cancelled: []
};

export const restaurantService = {
  getTenantSnapshot() {
    return { organization, location, diningAreas, tables, categories, menuItems, orders, payments };
  },

  createOrder(tableToken: string, cart: Array<{ itemId: string; quantity: number; notes?: string }>, customerName?: string): Order {
    const table = tables.find((item) => item.publicToken === tableToken);
    if (!table) throw new Error('Invalid table QR code.');

    const selectedItems = cart.map((cartItem) => {
      const menuItem = menuItems.find((item) => item.id === cartItem.itemId && item.isAvailable);
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
      orderNumber: 100 + orders.length + 1,
      tableId: table.id,
      customerName: customerName || 'Guest',
      orderStatus: 'placed',
      paymentStatus: 'pending',
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      createdAt: new Date().toISOString(),
      items: selectedItems
    };

    orders.unshift(nextOrder);
    table.status = 'occupied';
    return nextOrder;
  },

  changeOrderStatus(orderId: string, nextStatus: OrderStatus) {
    const order = orders.find((item) => item.id === orderId);
    if (!order) throw new Error('Order not found.');
    if (!statusFlow[order.orderStatus].includes(nextStatus)) {
      throw new Error(`Cannot move order from ${order.orderStatus} to ${nextStatus}.`);
    }
    order.orderStatus = nextStatus;
    return order;
  },

  recordPayment(orderId: string, method: PaymentMethod) {
    const order = orders.find((item) => item.id === orderId);
    if (!order) throw new Error('Order not found.');
    if (order.paymentStatus === 'paid') throw new Error('Order is already paid.');
    payments.unshift({
      id: crypto.randomUUID(),
      orderId,
      amount: order.totalAmount,
      paymentMethod: method,
      paidAt: new Date().toISOString()
    });
    order.paymentStatus = 'paid';
    order.orderStatus = order.orderStatus === 'completed' ? 'completed' : 'completed';
    const table = tables.find((item) => item.id === order.tableId);
    if (table) table.status = 'cleaning';
    return order;
  },

  getAvailableItems(): MenuItem[] {
    return menuItems.filter((item) => item.isAvailable);
  }
};
