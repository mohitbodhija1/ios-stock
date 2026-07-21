import type { DiningArea, DiningTable, Location, MenuCategory, MenuItem, Order, Organization, Payment } from '../types';

export const organization: Organization = {
  id: 'org-food-house',
  name: 'Food House Pvt. Ltd.',
  slug: 'food-house'
};

export const location: Location = {
  id: 'loc-delhi',
  organizationId: organization.id,
  name: 'Food House Delhi',
  slug: 'delhi',
  city: 'Delhi',
  currency: 'INR'
};

export const diningAreas: DiningArea[] = [
  { id: 'area-main', locationId: location.id, name: 'Main Dining' },
  { id: 'area-rooftop', locationId: location.id, name: 'Rooftop' }
];

export const tables: DiningTable[] = [
  { id: 'table-1', locationId: location.id, diningAreaId: 'area-main', tableNumber: '1', displayName: 'Table 1', capacity: 2, status: 'occupied', publicToken: 'qr-table-1' },
  { id: 'table-2', locationId: location.id, diningAreaId: 'area-main', tableNumber: '2', displayName: 'Table 2', capacity: 4, status: 'available', publicToken: 'qr-table-2' },
  { id: 'table-3', locationId: location.id, diningAreaId: 'area-rooftop', tableNumber: 'R1', displayName: 'Rooftop 1', capacity: 6, status: 'available', publicToken: 'qr-rooftop-1' },
  { id: 'table-4', locationId: location.id, diningAreaId: 'area-rooftop', tableNumber: 'R2', displayName: 'Rooftop 2', capacity: 4, status: 'cleaning', publicToken: 'qr-rooftop-2' }
];

export const categories: MenuCategory[] = [
  { id: 'cat-starters', name: 'Starters', displayOrder: 1 },
  { id: 'cat-mains', name: 'Mains', displayOrder: 2 },
  { id: 'cat-drinks', name: 'Drinks', displayOrder: 3 }
];

export const menuItems: MenuItem[] = [
  { id: 'item-paneer', categoryId: 'cat-starters', name: 'Paneer Tikka', description: 'Charred cottage cheese, peppers, mint chutney.', basePrice: 320, taxPercentage: 5, foodType: 'vegetarian', isAvailable: true },
  { id: 'item-kebab', categoryId: 'cat-starters', name: 'Seekh Kebab', description: 'Smoky minced kebab with onion salad.', basePrice: 390, taxPercentage: 5, foodType: 'non_vegetarian', isAvailable: true },
  { id: 'item-biryani', categoryId: 'cat-mains', name: 'Dum Biryani', description: 'Aromatic rice, saffron, raita, salan.', basePrice: 460, taxPercentage: 5, foodType: 'non_vegetarian', isAvailable: true },
  { id: 'item-dal', categoryId: 'cat-mains', name: 'Dal Makhani', description: 'Slow-cooked black lentils finished with butter.', basePrice: 340, taxPercentage: 5, foodType: 'vegetarian', isAvailable: true },
  { id: 'item-coffee', categoryId: 'cat-drinks', name: 'Cold Coffee', description: 'Cafe-style cold coffee with vanilla notes.', basePrice: 180, taxPercentage: 5, foodType: 'beverage', isAvailable: true },
  { id: 'item-lassi', categoryId: 'cat-drinks', name: 'Mango Lassi', description: 'Chilled yogurt drink with alphonso mango.', basePrice: 160, taxPercentage: 5, foodType: 'beverage', isAvailable: false }
];

export const orders: Order[] = [
  {
    id: 'order-101',
    publicId: 'pub-101',
    orderNumber: 101,
    tableId: 'table-1',
    customerName: 'Guest',
    orderStatus: 'preparing',
    paymentStatus: 'pending',
    subtotal: 780,
    taxAmount: 39,
    totalAmount: 819,
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    items: [
      { id: 'oi-1', menuItemId: 'item-paneer', itemNameSnapshot: 'Paneer Tikka', quantity: 1, unitPrice: 320, taxAmount: 16, totalAmount: 336 },
      { id: 'oi-2', menuItemId: 'item-biryani', itemNameSnapshot: 'Dum Biryani', quantity: 1, unitPrice: 460, taxAmount: 23, totalAmount: 483 }
    ]
  },
  {
    id: 'order-102',
    publicId: 'pub-102',
    orderNumber: 102,
    tableId: 'table-2',
    customerName: 'Walk-in',
    orderStatus: 'ready',
    paymentStatus: 'pending',
    subtotal: 520,
    taxAmount: 26,
    totalAmount: 546,
    createdAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    items: [
      { id: 'oi-3', menuItemId: 'item-dal', itemNameSnapshot: 'Dal Makhani', quantity: 1, unitPrice: 340, taxAmount: 17, totalAmount: 357 },
      { id: 'oi-4', menuItemId: 'item-coffee', itemNameSnapshot: 'Cold Coffee', quantity: 1, unitPrice: 180, taxAmount: 9, totalAmount: 189 }
    ]
  }
];

export const payments: Payment[] = [
  { id: 'pay-1', orderId: 'order-100', amount: 1220, paymentMethod: 'upi', paidAt: new Date().toISOString() }
];
