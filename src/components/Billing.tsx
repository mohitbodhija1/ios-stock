import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { restaurantService } from '../services/restaurantService';
import { currency } from '../utils/formatters';
import { useToast } from './Toast';
import type { useSnapshot } from '../hooks/useSnapshot';
import type { PaymentMethod } from '../types';

export function Billing({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const toast = useToast();
  const unpaidOrders = snapshot.orders.filter(
    (order) => order.paymentStatus === 'pending' && order.orderStatus !== 'cancelled'
  );
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [selectedOrderId, setSelectedOrderId] = useState(unpaidOrders[0]?.id || '');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedOrderId && unpaidOrders.length > 0) {
      setSelectedOrderId(unpaidOrders[0].id);
    }
  }, [selectedOrderId, unpaidOrders]);

  const selectedOrder = unpaidOrders.find((order) => order.id === selectedOrderId) || unpaidOrders[0];
  const selectedTable = selectedOrder ? snapshot.tables.find((item) => item.id === selectedOrder.tableId) : null;

  async function handlePayment() {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      await restaurantService.recordPayment(selectedOrder.id, method);
      snapshot.refresh();
      setIsCheckoutOpen(false);
      toast.success('Payment recorded successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Payment recording failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  const checkoutContent = selectedOrder && (
    <>
      <div className="section-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{selectedTable?.displayName || 'Table Order'}</h2>
          <small style={{ color: 'var(--muted)' }}>Order #{selectedOrder.orderNumber} • {selectedOrder.customerName || 'Guest'}</small>
        </div>
        <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '6px', background: '#fff7ed', color: '#c2410c', fontWeight: 800 }}>
          UNPAID
        </span>
      </div>

      <div className="bill-item-breakdown" style={{ display: 'grid', gap: '8px', margin: '10px 0', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '0.85rem', color: '#475467', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Itemized Order Breakdown
        </h3>
        {selectedOrder.items.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', fontSize: '0.88rem' }}>
            <div>
              <strong style={{ color: '#0f172a' }}>{item.quantity} x {item.itemNameSnapshot}</strong>
              {item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Note: {item.notes}</div>}
            </div>
            <b style={{ color: '#0f172a' }}>{currency.format(item.totalAmount)}</b>
          </div>
        ))}
      </div>

      <div className="bill-totals">
        <span>
          Items Total <b>{currency.format(selectedOrder.subtotal)}</b>
        </span>
        <span>
          Tax (5% GST) <b>{currency.format(selectedOrder.taxAmount)}</b>
        </span>
        <span className="grand">
          Total Amount Due <b>{currency.format(selectedOrder.totalAmount)}</b>
        </span>
      </div>

      <h3 style={{ margin: '14px 0 6px', fontSize: '0.9rem' }}>Select Payment Method</h3>
      <div className="payment-methods">
        {(['cash', 'card', 'upi'] as PaymentMethod[]).map((item) => (
          <button className={method === item ? 'active' : ''} onClick={() => setMethod(item)} key={item}>
            {item.toUpperCase()}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <section className="stack billing-screen">
      <div className="page-title">
        <h1>Unpaid Orders</h1>
      </div>
      <div className="bill-list">
        {unpaidOrders.length === 0 ? (
          <p style={{ color: 'var(--muted)', padding: '16px' }}>No pending unpaid orders.</p>
        ) : (
          unpaidOrders.map((order) => {
            const table = snapshot.tables.find((item) => item.id === order.tableId);
            return (
              <button
                className={`bill-row ${order.id === selectedOrder?.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedOrderId(order.id);
                  setIsCheckoutOpen(true);
                }}
                key={order.id}
              >
                <span>
                  <b>{table?.displayName || 'Table'}</b>
                  <small>#{order.orderNumber} • {order.customerName || 'Guest'}</small>
                </span>
                <span>
                  <b>{currency.format(order.totalAmount)}</b>
                  <small>Unpaid</small>
                </span>
              </button>
            );
          })
        )}
      </div>

      {selectedOrder && (
        <article className="checkout-card">
          {checkoutContent}

          <button className="primary-action wide" style={{ marginTop: '12px' }} disabled={isSubmitting} onClick={handlePayment}>
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : `Mark Order Paid (${currency.format(selectedOrder.totalAmount)})`}
          </button>
        </article>
      )}

      {selectedOrder && isCheckoutOpen && (
        <div className="modal-overlay billing-payment-modal" onClick={() => setIsCheckoutOpen(false)}>
          <article className="checkout-card billing-payment-modal-card" onClick={(event) => event.stopPropagation()}>
            <button className="billing-modal-close" type="button" onClick={() => setIsCheckoutOpen(false)} aria-label="Close payment modal">
              <X size={18} />
            </button>
            {checkoutContent}
            <div className="billing-modal-actions">
              <button className="subtle-button" type="button" onClick={() => setIsCheckoutOpen(false)}>
                Cancel
              </button>
              <button className="primary-action" type="button" disabled={isSubmitting} onClick={handlePayment}>
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : `Mark Paid (${currency.format(selectedOrder.totalAmount)})`}
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
