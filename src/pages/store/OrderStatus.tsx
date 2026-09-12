import './store.css';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '../../services/api';
import { format } from 'date-fns';

const STEPS = [
  { key: 'PLACED',           label: 'Order Placed',     icon: '📋' },
  { key: 'CONFIRMED',        label: 'Confirmed',         icon: '✅' },
  { key: 'PREPARING',        label: 'Being Prepared',    icon: '👨‍🍳' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery',  icon: '🛵' },
  { key: 'DELIVERED',        label: 'Delivered',         icon: '🎉' },
];

export default function StoreOrderStatus() {
  const { slug, orderId } = useParams<{ slug: string; orderId: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => tenantApi(slug!).get(`/orders/${orderId}`).then(r => r.data),
    enabled: !!orderId,
    refetchInterval: 30_000,
  });

  if (isLoading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="empty"><h2>Loading…</h2></div>
    </div>
  );

  if (!order) return (
    <div className="page"><div className="empty"><h2>Order not found</h2></div></div>
  );

  const currentIdx = STEPS.findIndex(s => s.key === order.status);
  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = order.status === 'DELIVERED';

  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate(`/store/${slug}`)}>← Continue Shopping</button>

      {/* Hero state */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>
          {isCancelled ? '❌' : isDelivered ? '🎉' : '📦'}
        </div>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>
          {isCancelled ? 'Order Cancelled' : isDelivered ? 'Order Delivered!' : 'Order Placed'}
        </h1>
        <p style={{ color: 'var(--vs-text-muted)', fontSize: 14, margin: 0 }}>
          Order #{order.orderNumber}
        </p>
      </div>

      {/* Timeline — not shown for cancelled */}
      {!isCancelled && (
        <div className="summary" style={{ marginBottom: 20 }}>
          <ul className="timeline">
            {STEPS.map((step, i) => {
              const done = i <= currentIdx;
              return (
                <li key={step.key} data-done={done}>
                  <div className="timeline__dot">{done ? step.icon : ''}</div>
                  <div>
                    <div className="timeline__label">{step.label}</div>
                    {i === currentIdx && order.updatedAt && (
                      <div className="timeline__time">
                        {format(new Date(order.updatedAt), 'dd MMM, HH:mm')}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Order items */}
      {order.items?.length > 0 && (
        <div className="summary" style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Items</p>
          {order.items.map((item: any, i: number) => (
            <div key={i} className="summary__row summary__row--line">
              <div className="summary__item">
                <div className="summary__thumb">📦</div>
                <span className="summary__name">{item.productName || item.name}</span>
                <span className="summary__meta">× {item.quantity}</span>
              </div>
              <span className="summary__line-total">₹{item.subtotal || item.price * item.quantity}</span>
            </div>
          ))}
          <div className="summary__row summary__row--total">
            <span>Total Paid</span>
            <span>₹{order.total}</span>
          </div>
        </div>
      )}

      {/* Payment badge */}
      <div className="notice">
        💳 {order.paymentMode} · {' '}
        <span style={{ color: order.paymentStatus === 'PAID' ? 'var(--vs-success)' : 'var(--vs-text-muted)' }}>
          {order.paymentStatus}
        </span>
      </div>

      <button className="btn btn--block" onClick={() => navigate(`/store/${slug}`)}>
        Shop More
      </button>
    </div>
  );
}
