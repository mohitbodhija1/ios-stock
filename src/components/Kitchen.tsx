import React from 'react';
import { ChefHat, Phone, Calendar } from 'lucide-react';
import { restaurantService } from '../services/restaurantService';
import { statusLabel, formatTime } from '../utils/formatters';
import { useToast } from './Toast';
import type { useSnapshot } from '../hooks/useSnapshot';
import type { Order, OrderStatus } from '../types';

export function Kitchen({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const toast = useToast();
  const kitchenOrders = snapshot.orders.filter((order) =>
    ['placed', 'confirmed', 'preparing', 'ready'].includes(order.orderStatus)
  );

  function nextStatus(order: Order): OrderStatus | null {
    if (order.orderStatus === 'placed') return 'confirmed';
    if (order.orderStatus === 'confirmed') return 'preparing';
    if (order.orderStatus === 'preparing') return 'ready';
    if (order.orderStatus === 'ready') return 'served';
    return null;
  }

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    try {
      await restaurantService.changeOrderStatus(orderId, status);
      snapshot.refresh();
      toast.success(`Order status updated to ${statusLabel(status)}`);
    } catch (err: any) {
      toast.error(err.message || 'Status update failed');
    }
  }

  return (
    <section className="stack kitchen-board">
      <div className="page-title">
        <h1>Kitchen Display System (Realtime)</h1>
      </div>

      {kitchenOrders.length === 0 ? (
        <div className="flex-center" style={{ padding: '40px 0', color: 'var(--muted)', textAlign: 'center' }}>
          <ChefHat size={48} />
          <p style={{ marginTop: '12px' }}>No active kitchen orders at the moment.</p>
        </div>
      ) : (
        <div className="orders-list stack" style={{ gap: '12px' }}>
          {kitchenOrders.map((order) => {
            const table = snapshot.tables.find((item) => item.id === order.tableId);
            const next = nextStatus(order);
            return (
              <article className="order-card" key={order.id}>
                <div className="order-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 800 }}>
                      {table?.displayName || 'Guest Order'}{' '}
                      <small style={{ color: '#64748b', fontWeight: 600 }}>
                        ({order.customerName || 'Guest'})
                      </small>
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      #{order.orderNumber} • <span style={{ marginLeft: 0 }}>{formatTime(order.createdAt)}</span>
                    </p>
                  </div>
                  <span className={`order-status ${order.orderStatus}`}>{statusLabel(order.orderStatus)}</span>
                </div>

                {(order.customerPhone || order.customerBirthdate) && (
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', display: 'flex', gap: '12px' }}>
                    {order.customerPhone && <span><Phone size={12} /> {order.customerPhone}</span>}
                    {order.customerBirthdate && <span><Calendar size={12} /> DOB: {order.customerBirthdate}</span>}
                  </div>
                )}

                <div className="order-lines" style={{ margin: '12px 0', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.88rem' }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', color: '#0f172a' }}>
                      <span style={{ fontWeight: 700 }}>{item.quantity} x {item.itemNameSnapshot}</span>
                      {item.notes && <small style={{ color: '#64748b' }}>({item.notes})</small>}
                    </div>
                  ))}
                </div>
                {next && (
                  <div className="kitchen-actions" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      className={`primary-action compact ${next === 'ready' || order.orderStatus === 'ready' ? 'green' : ''}`}
                      onClick={() => handleStatusChange(order.id, next)}
                      style={{ width: '100%' }}
                    >
                      {order.orderStatus === 'placed'
                        ? 'Confirm Order'
                        : next === 'served'
                        ? 'Ready & Served'
                        : `Mark as ${statusLabel(next)}`}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
