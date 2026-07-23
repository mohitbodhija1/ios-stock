import { Link } from 'react-router-dom';
import { ClipboardList, IndianRupee } from 'lucide-react';
import type { Order } from '../types';

export function canUpdateOrder(order: Order) {
  return order.paymentStatus === 'pending' && !['completed', 'cancelled'].includes(order.orderStatus);
}

export function canBillOrder(order: Order) {
  return order.paymentStatus === 'pending' && order.orderStatus !== 'cancelled';
}

export function OrderHistoryActions({
  order,
  compact = false
}: {
  order: Order;
  compact?: boolean;
}) {
  const showUpdate = canUpdateOrder(order);
  const showPay = canBillOrder(order);

  if (!showUpdate && !showPay) {
    return null;
  }

  return (
    <div className={`order-history-actions ${compact ? 'compact' : ''}`}>
      {showUpdate && (
        <Link to={`/app/order?order=${order.id}`} className="order-history-action-btn update">
          <ClipboardList size={14} />
          Update Order
        </Link>
      )}
      {showPay && (
        <Link to={`/app/billing?order=${order.id}`} className="order-history-action-btn pay">
          <IndianRupee size={14} />
          Bill Payment
        </Link>
      )}
    </div>
  );
}
