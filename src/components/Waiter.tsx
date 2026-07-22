import React, { useState, useEffect } from 'react';
import { Minus, Plus, Loader2 } from 'lucide-react';
import { restaurantService } from '../services/restaurantService';
import { currency, cartEntries } from '../utils/formatters';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { useToast } from './Toast';
import type { useSnapshot } from '../hooks/useSnapshot';

export function Waiter({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const toast = useToast();
  const [selectedTableId, setSelectedTableId] = useState(snapshot.tables[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    if (tableParam && snapshot.tables.some((t) => t.id === tableParam)) {
      setSelectedTableId(tableParam);
    }
  }, [snapshot.tables]);

  const selectedTable = snapshot.tables.find((table) => table.id === selectedTableId) || snapshot.tables[0];
  const cartItems = cartEntries(cart, snapshot.menuItems);
  const total = cartItems.reduce((sum, entry) => sum + entry.item.basePrice * entry.quantity, 0);

  const availableItems = snapshot.menuItems.filter((item) => {
    if (!item.isAvailable) return false;
    if (selectedCategoryId === 'all') return true;
    return item.categoryId === selectedCategoryId;
  });

  function setQty(itemId: string, nextQty: number) {
    setCart((current) => {
      const next = { ...current };
      if (nextQty <= 0) delete next[itemId];
      else next[itemId] = nextQty;
      return next;
    });
  }

  async function handleConfirmOrder(customerName: string, customerPhone: string, customerBirthdate: string) {
    if (!selectedTable) return;
    const items = Object.entries(cart).map(([itemId, quantity]) => ({ itemId, quantity }));
    if (!items.length) return;
    setIsSubmitting(true);
    try {
      await restaurantService.createOrder(
        selectedTable.publicToken,
        items,
        customerName,
        customerPhone,
        customerBirthdate
      );
      setCart({});
      setShowDetailsModal(false);
      await snapshot.refresh();
      toast.success('Order sent to kitchen!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="stack waiter-screen">
      <CustomerDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onSubmit={handleConfirmOrder}
        isSubmitting={isSubmitting}
        title={`Table Order - ${selectedTable?.displayName || 'Guest'}`}
      />

      {/* Row 1: Tables selection row */}
      <div className="table-chips-row" style={{ width: '100%', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {snapshot.tables.map((table) => (
          <button
            key={table.id}
            className={`table-select-chip ${table.id === selectedTableId ? 'active' : ''}`}
            onClick={() => setSelectedTableId(table.id)}
          >
            <span className={`status-dot ${table.status}`} />
            {table.displayName}
          </button>
        ))}
      </div>

      {/* Row 2: Category Filter Tabs */}
      <div className="pos-category-row">
        <button
          className={`pos-category-btn ${selectedCategoryId === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategoryId('all')}
        >
          All Items ({snapshot.menuItems.filter((i) => i.isAvailable).length})
        </button>
        {snapshot.categories.map((cat, idx) => (
          <button
            key={cat.id}
            className={`pos-category-btn cat-tone-${idx % 4} ${selectedCategoryId === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategoryId(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* POS Menu Grid */}
      <div className="pos-menu-grid">
        {availableItems.map((item) => {
          const qty = cart[item.id] || 0;
          return (
            <div
              key={item.id}
              className={`pos-menu-card ${qty > 0 ? 'selected' : ''}`}
              onClick={() => setQty(item.id, qty + 1)}
            >
              <div className="pos-card-content">
                <strong className="pos-item-name">{item.name}</strong>
                <span className="pos-item-price">{currency.format(item.basePrice)}</span>
              </div>
              {qty > 0 ? (
                <div className="pos-qty-badge-controls" onClick={(e) => e.stopPropagation()}>
                  <button className="pos-qty-btn minus" onClick={() => setQty(item.id, qty - 1)}>
                    <Minus size={14} />
                  </button>
                  <span className="pos-qty-count">{qty}</span>
                  <button className="pos-qty-btn plus" onClick={() => setQty(item.id, qty + 1)}>
                    <Plus size={14} />
                  </button>
                </div>
              ) : (
                <div className="pos-add-hint">+ Add</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Order Bar */}
      {cartItems.length > 0 && (
        <article className="pos-bottom-order-bar">
          <div className="pos-order-summary">
            <div>
              <strong>{cartItems.reduce((sum, entry) => sum + entry.quantity, 0)} Items</strong>
              <span>Table: <b>{selectedTable?.displayName}</b></span>
            </div>
            <strong className="pos-total-price">{currency.format(total)}</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="subtle-button danger-button" onClick={() => setCart({})}>
              Clear
            </button>
            <button
              className="primary-action"
              style={{ flex: 1 }}
              disabled={isSubmitting}
              onClick={() => setShowDetailsModal(true)}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Place Order →'}
            </button>
          </div>
        </article>
      )}
    </section>
  );
}

export function QuantityControl({ quantity, onMinus, onPlus }: { quantity: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="quantity-control">
      <button onClick={onMinus} aria-label="Decrease quantity"><Minus size={14} /></button>
      <strong>{quantity || 0}</strong>
      <button onClick={onPlus} aria-label="Increase quantity"><Plus size={14} /></button>
    </div>
  );
}
