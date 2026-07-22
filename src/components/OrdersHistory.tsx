import React, { useState } from 'react';
import { ReceiptText, Search, X, Printer } from 'lucide-react';
import { currency, statusLabel, formatTime } from '../utils/formatters';
import type { useSnapshot } from '../hooks/useSnapshot';
import type { Order } from '../types';

export function OrdersHistory({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);

  const pastOrders = snapshot.orders.filter((order) => {
    if (statusFilter === 'completed') return order.orderStatus === 'completed' || order.paymentStatus === 'paid';
    if (statusFilter === 'cancelled') return order.orderStatus === 'cancelled';
    return true;
  });

  const filteredOrders = pastOrders.filter((order) => {
    const table = snapshot.tables.find((t) => t.id === order.tableId);
    const searchLower = searchQuery.trim().toLowerCase();
    if (!searchLower) return true;

    const orderNumStr = order.orderNumber.toString();
    const orderIdStr = `ord-${order.orderNumber}`.toLowerCase();
    const customerStr = (order.customerName || '').toLowerCase();
    const phoneStr = (order.customerPhone || '').toLowerCase();
    const tableNameStr = (table?.displayName || '').toLowerCase();
    const itemsMatch = order.items.some((item) => item.itemNameSnapshot.toLowerCase().includes(searchLower));

    return (
      orderNumStr.includes(searchLower) ||
      orderIdStr.includes(searchLower) ||
      customerStr.includes(searchLower) ||
      phoneStr.includes(searchLower) ||
      tableNameStr.includes(searchLower) ||
      itemsMatch
    );
  });

  return (
    <section className="stack orders-screen">
      {selectedOrderForReceipt && (
        <ReceiptModal
          order={selectedOrderForReceipt}
          snapshot={snapshot}
          onClose={() => setSelectedOrderForReceipt(null)}
        />
      )}

      <div className="page-title">
        <h1>Order History</h1>
        <ReceiptText size={20} />
      </div>

      <div className="toolbar-row" style={{ gap: '12px', flexWrap: 'wrap' }}>
        <label className="search-field" style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#fff', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <Search size={16} style={{ color: 'var(--muted)' }} />
          <input
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.88rem' }}
            placeholder="Search Order #, Customer, Phone, Dish Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="ghost-icon" onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </label>
        <div className="chip-row">
          <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>
            All ({snapshot.orders.length})
          </button>
          <button
            className={statusFilter === 'completed' ? 'active' : ''}
            onClick={() => setStatusFilter('completed')}
          >
            Completed ({snapshot.orders.filter((o) => o.paymentStatus === 'paid' || o.orderStatus === 'completed').length})
          </button>
          <button
            className={statusFilter === 'cancelled' ? 'active' : ''}
            onClick={() => setStatusFilter('cancelled')}
          >
            Cancelled ({snapshot.orders.filter((o) => o.orderStatus === 'cancelled').length})
          </button>
        </div>
      </div>

      <div className="orders-list stack" style={{ gap: '12px' }}>
        {filteredOrders.length === 0 ? (
          <div className="flex-center" style={{ padding: '40px 0', color: 'var(--muted)', textAlign: 'center' }}>
            <ReceiptText size={48} />
            <p style={{ marginTop: '12px' }}>No past orders found.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const table = snapshot.tables.find((t) => t.id === order.tableId);
            const payment = snapshot.payments.find((p) => p.orderId === order.id);
            const payMethod = payment?.paymentMethod || 'cash';

            return (
              <article className="order-card" key={order.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: '#fff' }}>
                <div className="order-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{table?.displayName || 'Table'} <small style={{ color: 'var(--muted)', fontWeight: 400 }}>({order.customerName || 'Guest'})</small></h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                      #{order.orderNumber} • {new Date(order.createdAt).toLocaleString()}
                    </p>
                    {(order.customerPhone || order.customerBirthdate) && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
                        {order.customerPhone && <span>Phone: {order.customerPhone} </span>}
                        {order.customerBirthdate && <span>• DOB: {order.customerBirthdate}</span>}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`order-status ${order.orderStatus}`}>{statusLabel(order.orderStatus)}</span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '8px', background: '#e0e7ff', color: '#3730a3', textTransform: 'uppercase', fontWeight: 700 }}>
                      {payMethod}
                    </span>
                  </div>
                </div>

                <div className="order-lines" style={{ margin: '12px 0', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                      <span>{item.quantity} x {item.itemNameSnapshot}</span>
                      <b>{currency.format(item.totalAmount)}</b>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                  <div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Total Amount: </span>
                    <strong style={{ fontSize: '1.05rem' }}>{currency.format(order.totalAmount)}</strong>
                  </div>
                  <button
                    className="subtle-button compact"
                    onClick={() => setSelectedOrderForReceipt(order)}
                    style={{ gap: '6px' }}
                  >
                    <Printer size={14} /> View / Print Receipt
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export function ReceiptModal({
  order,
  snapshot,
  onClose
}: {
  order: Order;
  snapshot: ReturnType<typeof useSnapshot>;
  onClose: () => void;
}) {
  const table = snapshot.tables.find((t) => t.id === order.tableId);
  const payment = snapshot.payments.find((p) => p.orderId === order.id);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="modal-overlay no-print-overlay">
      <div className="receipt-modal-card">
        <div className="printable-receipt">
          <div className="receipt-header-brand">
            <h2>{snapshot.organization.name}</h2>
            <p>{snapshot.location.name} • {snapshot.location.city}</p>
            <p style={{ fontSize: '0.72rem', marginTop: '4px', fontWeight: 700 }}>TAX INVOICE / RECEIPT</p>
          </div>

          <div className="receipt-meta-row">
            <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
            <span>Time: {formatTime(order.createdAt)}</span>
          </div>
          <div className="receipt-meta-row">
            <span>Order #: {order.orderNumber}</span>
            <span>Table: {table?.displayName || 'N/A'}</span>
          </div>
          <div className="receipt-meta-row">
            <span>Customer: {order.customerName || 'Guest'}</span>
          </div>
          {order.customerPhone && (
            <div className="receipt-meta-row">
              <span>Phone: {order.customerPhone}</span>
            </div>
          )}

          <div className="receipt-table-header">
            <span>Item</span>
            <span>Qty</span>
            <span>Amt</span>
          </div>

          {order.items.map((item) => (
            <div className="receipt-table-row" key={item.id}>
              <span>{item.itemNameSnapshot}</span>
              <span>{item.quantity}</span>
              <span>{currency.format(item.totalAmount)}</span>
            </div>
          ))}

          <div className="receipt-divider" />

          <div className="receipt-totals-row">
            <span>Subtotal</span>
            <span>{currency.format(order.subtotal)}</span>
          </div>
          <div className="receipt-totals-row">
            <span>Tax (5% GST)</span>
            <span>{currency.format(order.taxAmount)}</span>
          </div>
          <div className="receipt-totals-row grand-total">
            <span>TOTAL</span>
            <span>{currency.format(order.totalAmount)}</span>
          </div>

          <div className="receipt-meta-row" style={{ marginTop: '10px' }}>
            <span>Payment Mode:</span>
            <b>{(payment?.paymentMethod || 'CASH').toUpperCase()}</b>
          </div>

          <div className="receipt-footer-msg">
            <p>Thank you for dining with us!</p>
            <p>Please visit again.</p>
          </div>
        </div>

        <div className="form-row no-print" style={{ marginTop: '16px' }}>
          <button type="button" className="subtle-button" onClick={onClose}>
            Close
          </button>
          <button type="button" className="primary-action" onClick={handlePrint} style={{ gap: '6px' }}>
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
