import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { currency } from '../utils/formatters';
import { Metric } from './Dashboard';
import type { useSnapshot } from '../hooks/useSnapshot';

export function Reports({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const [showRevenue, setShowRevenue] = useState(true);
  const paidOrders = snapshot.orders.filter((order) => order.paymentStatus === 'paid');
  const revenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const cancelled = snapshot.orders.filter((order) => order.orderStatus === 'cancelled').length;
  const avgOrderValue = paidOrders.length ? Math.round(revenue / paidOrders.length) : 0;

  return (
    <section className="stack reports-screen">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Sales & Analytics</h1>
        <button
          className="eye-toggle-btn"
          onClick={() => setShowRevenue(!showRevenue)}
          title={showRevenue ? 'Hide Revenue' : 'Show Revenue'}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          {showRevenue ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>{showRevenue ? 'Hide Revenue' : 'Show Revenue'}</span>
        </button>
      </div>
      <div className="metric-grid two">
        <Metric label="Total Live Revenue" value={showRevenue ? currency.format(revenue) : '₹ ••••••'} tone="warm" />
        <Metric label="Completed Paid Orders" value={paidOrders.length.toString()} tone="violet" />
        <Metric label="Cancelled Orders" value={cancelled.toString()} tone="red" />
        <Metric label="Avg Order Value" value={showRevenue ? currency.format(avgOrderValue) : '₹ ••••••'} tone="blue" />
      </div>
    </section>
  );
}
