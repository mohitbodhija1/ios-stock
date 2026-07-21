export type Role = 'owner' | 'manager' | 'waiter' | 'kitchen_staff' | 'cashier';
export type TableStatus = 'available' | 'occupied' | 'cleaning' | 'inactive';
export type OrderStatus = 'placed' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid';
export type PaymentMethod = 'cash' | 'card' | 'upi';

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface Location {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  city: string;
  currency: string;
}

export interface DiningArea {
  id: string;
  locationId: string;
  name: string;
}

export interface DiningTable {
  id: string;
  locationId: string;
  diningAreaId: string;
  tableNumber: string;
  displayName: string;
  capacity: number;
  status: TableStatus;
  publicToken: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  taxPercentage: number;
  foodType: 'vegetarian' | 'non_vegetarian' | 'beverage' | 'vegan';
  isAvailable: boolean;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  itemNameSnapshot: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
}

export interface Order {
  id: string;
  publicId: string;
  orderNumber: number;
  tableId: string;
  customerName?: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
}
