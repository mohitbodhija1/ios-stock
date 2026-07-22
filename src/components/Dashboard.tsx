import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { currency } from '../utils/formatters';
import type { useSnapshot } from '../hooks/useSnapshot';

export function Dashboard({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const [showRevenue, setShowRevenue] = useState(false);
  const activeOrders = snapshot.orders.filter((order) => !['completed', 'cancelled'].includes(order.orderStatus));
  const occupiedTables = snapshot.tables.filter((table) => table.status === 'occupied').length;
  const paidOrders = snapshot.orders.filter((order) => order.paymentStatus === 'paid');
  const revenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <section className="stack dashboard-screen">
      <div className="dashboard-hero-row">
        <Metric label="Active Orders" value={activeOrders.length.toString()} tone="warm" note="In kitchen/dining" />
        <Metric label="Occupied Tables" value={`${occupiedTables}/${snapshot.tables.length}`} tone="violet" note={`${Math.round((occupiedTables / Math.max(1, snapshot.tables.length)) * 100)}% Occupancy`} />
        <article className="metric-card green revenue-metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span>Revenue</span>
            <button
              className="eye-toggle-btn"
              onClick={() => setShowRevenue(!showRevenue)}
              title={showRevenue ? 'Hide Revenue' : 'Show Revenue'}
            >
              {showRevenue ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          </div>
          <strong>{showRevenue ? currency.format(revenue) : '₹ ••••••'}</strong>
          <small>Paid Orders: <b>{paidOrders.length}</b></small>
        </article>
      </div>

      <div className="section-header" style={{ marginTop: '20px' }}>
        <h2>Floor Tables</h2>
        <div className="legend-row" style={{ marginTop: 0 }}>
          <span><i className="status-dot available" /> Available</span>
          <span><i className="status-dot occupied" /> Occupied</span>
        </div>
      </div>

      <div className="dashboard-tables-grid">
        {snapshot.tables.map((table) => {
          const effectiveStatus = table.status === ('cleaning' as any) ? 'available' : table.status;
          return (
            <Link
              key={table.id}
              to={`/app/waiter?table=${table.id}`}
              className={`dashboard-table-card ${effectiveStatus}`}
            >
              <div className="table-card-top">
                <span className={`status-dot ${effectiveStatus}`} />
                <span className="table-number-badge">{table.tableNumber}</span>
              </div>
              <strong className="table-display-name">{table.displayName}</strong>
              <small>{table.capacity} Seats • {snapshot.diningAreas.find((a) => a.id === table.diningAreaId)?.name || 'General'}</small>
              <span className={`table-status-label ${effectiveStatus}`}>
                {effectiveStatus.toUpperCase()}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function Metric({ label, value, tone, note }: { label: string; value: string; tone?: string; note?: string }) {
  return (
    <article className={`metric-card ${tone || ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}
