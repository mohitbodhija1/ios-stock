import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2, Check, Loader2, ChevronLeft,
  Search, SlidersHorizontal, ShoppingBag, Leaf
} from 'lucide-react';
import { restaurantService } from '../services/restaurantService';
import { currency, cartEntries, statusLabel, formatTime } from '../utils/formatters';
import { QuantityControl } from './Waiter';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { useSnapshot } from '../hooks/useSnapshot';
import { useToast } from './Toast';
import type { Order, DiningTable, MenuItem, OrderStatus } from '../types';

// --- Veg / Non-veg badge ---
function VegBadge({ foodType }: { foodType: MenuItem['foodType'] }) {
  const isVeg = foodType === 'vegetarian' || foodType === 'vegan';
  const isBev = foodType === 'beverage';
  const color = isBev ? '#2563eb' : isVeg ? '#16a34a' : '#92400e';
  return (
    <span
      className="co-veg-badge"
      style={{ borderColor: color }}
      title={foodType.replace('_', ' ')}
    >
      <span style={{ background: color }} />
    </span>
  );
}

// --- Gradient placeholder for items without an image ---
function ImagePlaceholder({ name, foodType }: { name: string; foodType: MenuItem['foodType'] }) {
  const isVeg = foodType === 'vegetarian' || foodType === 'vegan';
  const isBev = foodType === 'beverage';
  const gradient = isBev
    ? 'linear-gradient(135deg, #1e40af, #3b82f6)'
    : isVeg
    ? 'linear-gradient(135deg, #14532d, #22c55e)'
    : 'linear-gradient(135deg, #7c2d12, #f97316)';
  return (
    <div className="co-card-img co-card-img-placeholder" style={{ background: gradient }}>
      <span>{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

// --- Single menu item card ---
function CustomerMenuCard({
  item,
  qty,
  onAdd,
  onMinus,
  onPlus,
}: {
  item: MenuItem;
  qty: number;
  onAdd: () => void;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className={`co-card ${!item.isAvailable ? 'co-card-unavailable' : ''}`}>
      {/* Left image */}
      {item.imageUrl ? (
        <img className="co-card-img" src={item.imageUrl} alt={item.name} />
      ) : (
        <ImagePlaceholder name={item.name} foodType={item.foodType} />
      )}

      {/* Right content */}
      <div className="co-card-body">
        <div className="co-card-title-row">
          <div className="co-card-name-group">
            <VegBadge foodType={item.foodType} />
            <span className="co-card-name">{item.name}</span>
          </div>
          <span className="co-card-price">{currency.format(item.basePrice)}</span>
        </div>

        {item.description && (
          <p className="co-card-desc">{item.description}</p>
        )}

        <div className="co-card-footer">
          <span />
          {item.isAvailable ? (
            qty > 0 ? (
              <div className="co-stepper">
                <button onClick={onMinus}>−</button>
                <span>{qty}</span>
                <button onClick={onPlus}>+</button>
              </div>
            ) : (
              <button className="co-add-btn" onClick={onAdd}>Add</button>
            )
          ) : (
            <span className="co-unavailable-label">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main customer order screen ---
export function CustomerOrder() {
  const toast = useToast();
  const { tableToken } = useParams();
  const snapshot = useSnapshot({ tableToken, enabled: Boolean(tableToken) });
  const table = snapshot.tables.find((item) => item.publicToken === tableToken);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const cartItems = cartEntries(cart, snapshot.menuItems);
  const total = cartItems.reduce((sum, entry) => sum + entry.item.basePrice * entry.quantity, 0);
  const totalQuantity = cartItems.reduce((sum, entry) => sum + entry.quantity, 0);

  const visibleItems = snapshot.menuItems.filter((item) => {
    const matchesCategory = selectedCategoryId === 'all' || item.categoryId === selectedCategoryId;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function setQty(itemId: string, nextQty: number) {
    setCart((current) => {
      const next = { ...current };
      if (nextQty <= 0) delete next[itemId];
      else next[itemId] = nextQty;
      return next;
    });
  }

  async function handleConfirmCustomerOrder(name: string, phone: string, birthdate: string) {
    if (!table) return;
    setIsSubmitting(true);
    try {
      const order = await restaurantService.createOrder(
        table.publicToken,
        Object.entries(cart).map(([itemId, quantity]) => ({ itemId, quantity })),
        name,
        phone,
        birthdate
      );
      setSubmittedOrder(order);
      setCart({});
      setShowDetailsModal(false);
      snapshot.refresh();
      toast.success('Order placed successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!tableToken || (!snapshot.loading && !table)) {
    return (
      <div className="co-shell">
        <div className="admin-access-card" style={{ margin: '40px auto' }}>
          <p>Invalid or inactive table QR code.</p>
        </div>
      </div>
    );
  }

  if (snapshot.loading || !table) {
    return (
      <div className="co-shell flex-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (submittedOrder) {
    return (
      <div className="co-shell">
        <OrderConfirmation order={submittedOrder} table={table} />
      </div>
    );
  }

  return (
    <div className="co-shell">
      <CustomerDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onSubmit={handleConfirmCustomerOrder}
        isSubmitting={isSubmitting}
        title="Your Table Order Details"
      />

      {/* ── Header ── */}
      <header className="co-header">
        <button className="co-header-back" aria-label="Back">
          <ChevronLeft size={22} />
        </button>
        <div className="co-header-center">
          <strong>{table?.displayName || 'Menu'}</strong>
          <span>{snapshot.organization.name}</span>
        </div>
        <button className="co-header-details-btn">Table Details</button>
      </header>

      {/* ── Search bar ── */}
      <div className="co-search-row">
        <div className="co-search-inner">
          <Search size={16} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search for dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SlidersHorizontal size={16} color="#9ca3af" />
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className="co-tabs-wrap">
        <div className="co-tabs">
          <button
            className={`co-tab ${selectedCategoryId === 'all' ? 'co-tab-active' : ''}`}
            onClick={() => setSelectedCategoryId('all')}
          >
            <span className="co-tab-icon">🍽️</span>
            All
          </button>
          {snapshot.categories.map((category) => (
            <button
              key={category.id}
              className={`co-tab ${selectedCategoryId === category.id ? 'co-tab-active' : ''}`}
              onClick={() => setSelectedCategoryId(category.id)}
            >
              <span className="co-tab-icon">🍴</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu list ── */}
      <main className="co-menu-list">
        {visibleItems.length === 0 ? (
          <div className="co-empty">
            <Leaf size={36} color="#d1d5db" />
            <p>No items found</p>
          </div>
        ) : (
          visibleItems.map((item) => (
            <CustomerMenuCard
              key={item.id}
              item={item}
              qty={cart[item.id] || 0}
              onAdd={() => setQty(item.id, 1)}
              onMinus={() => setQty(item.id, (cart[item.id] || 1) - 1)}
              onPlus={() => setQty(item.id, (cart[item.id] || 0) + 1)}
            />
          ))
        )}
      </main>

      {/* ── Place Order bar ── */}
      <footer
        className={`co-place-order-bar ${totalQuantity === 0 ? 'co-place-order-bar-empty' : ''}`}
        onClick={() => totalQuantity > 0 && setShowDetailsModal(true)}
      >
        <div className="co-place-order-left">
          <ShoppingBag size={20} />
          <div>
            <strong>Place Order ({totalQuantity})</strong>
            <small>{totalQuantity === 0 ? 'Add items to get started' : `${totalQuantity} item${totalQuantity > 1 ? 's' : ''} in cart`}</small>
          </div>
        </div>
        <div className="co-place-order-right">
          <span>{currency.format(total)}</span>
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <span>›</span>}
        </div>
      </footer>
    </div>
  );
}

// --- Order Confirmation screen ---
export function OrderConfirmation({ order, table }: { order: Order; table: DiningTable }) {
  const steps: OrderStatus[] = ['placed', 'confirmed', 'preparing', 'ready', 'served'];

  return (
    <article className="success-panel">
      <CheckCircle2 size={58} />
      <h1>Order Placed!</h1>
      <p>Thank you. Your order has been received by the kitchen.</p>
      <div className="receipt-box">
        <span>
          Order ID <b>#ORD-{order.orderNumber}</b>
        </span>
        <span>
          Table <b>{table?.displayName}</b>
        </span>
        <span>
          Customer <b>{order.customerName || 'Guest'}</b>
        </span>
        {order.customerPhone && (
          <span>
            Phone <b>{order.customerPhone}</b>
          </span>
        )}
        <span>
          Placed At <b>{formatTime(order.createdAt)}</b>
        </span>
        <span>
          Total Items <b>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</b>
        </span>
        <span>
          Total Amount <b>{currency.format(order.totalAmount)}</b>
        </span>
      </div>
      <div className="status-track">
        <h2>Order Status</h2>
        {steps.map((step) => (
          <div className={`status-step ${step === order.orderStatus ? 'active' : ''}`} key={step}>
            <i>{step === order.orderStatus ? <Check size={11} /> : null}</i>
            <span>{statusLabel(step)}</span>
            {step === order.orderStatus && <small>{formatTime(order.createdAt)}</small>}
          </div>
        ))}
      </div>
    </article>
  );
}
