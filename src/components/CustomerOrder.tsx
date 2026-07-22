import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Check, Loader2 } from 'lucide-react';
import { restaurantService } from '../services/restaurantService';
import { currency, cartEntries, statusLabel, formatTime } from '../utils/formatters';
import { MenuItemCard } from './MenuManagement';
import { QuantityControl } from './Waiter';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { useSnapshot } from '../hooks/useSnapshot';
import { useToast } from './Toast';
import type { Order, DiningTable, OrderStatus } from '../types';

export function CustomerOrder() {
  const toast = useToast();
  const { tableToken } = useParams();
  const snapshot = useSnapshot();
  const table = snapshot.tables.find((item) => item.publicToken === tableToken) || snapshot.tables[0];
  const [cart, setCart] = useState<Record<string, number>>({});
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const cartItems = cartEntries(cart, snapshot.menuItems);
  const total = cartItems.reduce((sum, entry) => sum + entry.item.basePrice * entry.quantity, 0);
  const visibleItems = snapshot.menuItems.filter(
    (item) => item.isAvailable && (selectedCategoryId === 'all' || item.categoryId === selectedCategoryId)
  );

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

  const totalQuantity = cartItems.reduce((sum, entry) => sum + entry.quantity, 0);

  return (
    <div className="customer-shell">
      <CustomerDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onSubmit={handleConfirmCustomerOrder}
        isSubmitting={isSubmitting}
        title="Your Table Order Details"
      />

      {!submittedOrder && (
        <header className="customer-hero">
          <div>
            <span>{snapshot.organization.name}</span>
            <h1>{table?.displayName || 'Table Order'}</h1>
          </div>
        </header>
      )}

      <main className={`screen customer-screen ${submittedOrder ? 'confirmation' : ''}`}>
        {submittedOrder ? (
          <OrderConfirmation order={submittedOrder} table={table} />
        ) : (
          <>
            <div className="customer-tabs">
              <button
                className={selectedCategoryId === 'all' ? 'active' : ''}
                onClick={() => setSelectedCategoryId('all')}
              >
                All
              </button>
              {snapshot.categories.map((category) => (
                <button
                  className={selectedCategoryId === category.id ? 'active' : ''}
                  onClick={() => setSelectedCategoryId(category.id)}
                  key={category.id}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <div className="menu-list">
              {visibleItems.map((item) => (
                <MenuItemCard
                  item={item}
                  key={item.id}
                  action={
                    cart[item.id] ? (
                      <QuantityControl
                        quantity={cart[item.id]}
                        onMinus={() => setQty(item.id, cart[item.id] - 1)}
                        onPlus={() => setQty(item.id, cart[item.id] + 1)}
                      />
                    ) : (
                      <button className="add-button" onClick={() => setQty(item.id, 1)}>
                        Add
                      </button>
                    )
                  }
                />
              ))}
            </div>
          </>
        )}
      </main>

      {!submittedOrder && (
        <footer className="cart-bar">
          <button
            className="primary-action wide"
            disabled={!cartItems.length || isSubmitting}
            onClick={() => setShowDetailsModal(true)}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <span>Place Order ({totalQuantity})</span>
                <b>{currency.format(total)}</b>
              </>
            )}
          </button>
        </footer>
      )}
    </div>
  );
}

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
