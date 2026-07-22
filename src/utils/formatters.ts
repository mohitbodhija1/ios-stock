import type { MenuItem, OrderStatus } from '../types';

export const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function cartEntries(cart: Record<string, number>, menuItems: MenuItem[]) {
  return Object.entries(cart)
    .map(([itemId, quantity]) => ({ item: menuItems.find((menuItem) => menuItem.id === itemId), quantity }))
    .filter((entry): entry is { item: MenuItem; quantity: number } => Boolean(entry.item));
}

export function statusLabel(status: OrderStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
