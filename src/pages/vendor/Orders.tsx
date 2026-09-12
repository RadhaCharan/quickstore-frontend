import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ShoppingBag, X, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { safeFormat } from '../../shared/utils/date';

const STATUS_META: Record<string, { bg: string; color: string; label: string }> = {
  ALL:              { bg: '#f3f4f6', color: '#374151',  label: 'All' },
  PLACED:           { bg: '#dbeafe', color: '#1d4ed8',  label: 'Placed' },
  CONFIRMED:        { bg: '#fef3c7', color: '#b45309',  label: 'Confirmed' },
  PREPARING:        { bg: '#ffedd5', color: '#c2410c',  label: 'Preparing' },
  OUT_FOR_DELIVERY: { bg: '#ede9fe', color: '#6d28d9',  label: 'On the Way' },
  DELIVERED:        { bg: '#dcfce7', color: '#15803d',  label: 'Delivered' },
  CANCELLED:        { bg: '#fee2e2', color: '#b91c1c',  label: 'Cancelled' },
};

const ACTIONS = ['CONFIRMED','PREPARING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'];

function Chip({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.ALL;
  return <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: m.bg, color: m.color, fontWeight: 600 }}>{m.label}</span>;
}

function Panel({ order, onClose, onUpdate }: any) {
  if (!order) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 420, height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>#{order.orderNumber}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{safeFormat(order.createdAt, 'dd MMM yyyy, HH:mm')}</div>
          </div>
          <button onClick={onClose} style={{ background: '#f9fafb', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Status */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Status</div>
            <Chip status={order.status} />
          </div>

          {/* Customer */}
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Customer</div>
            {order.customerName && <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{order.customerName}</div>}
            {order.customerPhone && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}><Phone size={13} color="#9ca3af" />{order.customerPhone}</div>}
          </div>

          {/* Delivery address */}
          {order.address && (
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={12} /> Delivery Address
              </div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}
                {order.address.city ? `, ${order.address.city}` : ''}
                {order.address.pincode ? ` – ${order.address.pincode}` : ''}
              </div>
            </div>
          )}

          {/* Items */}
          {order.items?.length > 0 && (
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Items</div>
              {order.items.map((it: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', padding: '4px 0', borderBottom: i < order.items.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  <span>{it.productName || it.name} × {it.quantity}</span>
                  <span style={{ fontWeight: 600 }}>₹{it.subtotal || it.price * it.quantity}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#111827', marginTop: 10, paddingTop: 8, borderTop: '2px solid #e5e7eb' }}>
                <span>Total</span><span style={{ color: '#16a34a' }}>₹{order.total}</span>
              </div>
            </div>
          )}

          {/* Update status */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Update Status</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ACTIONS.filter(s => s !== order.status).map(s => {
                const m = STATUS_META[s];
                return (
                  <button key={s} onClick={() => onUpdate(s)} style={{ padding: '9px', borderRadius: 9, border: `1.5px solid ${m.bg}`, background: m.bg, color: m.color, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorOrders() {
  const [filter, setFilter] = useState('ALL');
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('orderId'));
  const qc = useQueryClient();

  // Deep-link support — the Dashboard's recent-orders rows / stat cards link here as
  // `?orderId=...` to open a specific order straight away instead of just the bare list.
  useEffect(() => {
    const id = searchParams.get('orderId');
    if (id && id !== selectedId) setSelectedId(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function closePanel() {
    setSelectedId(null);
    if (searchParams.get('orderId')) {
      const next = new URLSearchParams(searchParams);
      next.delete('orderId');
      setSearchParams(next, { replace: true });
    }
  }

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', filter],
    queryFn: () => api.get('/orders', { params: filter !== 'ALL' ? { status: filter } : {} }).then(r => {
      const d = r.data;
      // /orders returns { data: [...], total, page, limit, totalPages } — not { items }.
      return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.items) ? d.items : [];
    }),
  });

  // The list only carries summary fields — fetch the full order (with line items) once a
  // row is opened, rather than bloating every page of the list with every order's items.
  const { data: orderDetail } = useQuery({
    queryKey: ['order', selectedId],
    queryFn: () => api.get(`/orders/${selectedId}`).then(r => r.data),
    enabled: !!selectedId,
  });

  const upd = useMutation({
    mutationFn: ({ id, status }: any) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); closePanel(); toast.success('Updated'); },
  });

  return (
    <div style={{ padding: 28, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Orders</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{orders.length} orders</p>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {Object.keys(STATUS_META).map(s => {
          const m = STATUS_META[s];
          const active = filter === s;
          return (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: active ? '#0f172a' : '#f1f5f9', color: active ? '#fff' : '#374151' }}>
              {m.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Loading…</div>
      ) : orders.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 64, textAlign: 'center' }}>
          <ShoppingBag size={36} color="#d1d5db" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: '#9ca3af', fontSize: 14 }}>No orders found</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['Order', 'Customer', 'Total', 'Payment', 'Status', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', color: '#6b7280', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer' }} onClick={() => setSelectedId(o.id)}>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: '#111827' }}>#{o.orderNumber}</td>
                  <td style={{ padding: '13px 16px', color: '#374151' }}>{o.customerName || o.customerPhone || '—'}</td>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: '#16a34a' }}>₹{o.total}</td>
                  <td style={{ padding: '13px 16px' }}><Chip status={o.paymentStatus === 'PAID' ? 'DELIVERED' : 'PLACED'} /></td>
                  <td style={{ padding: '13px 16px' }}><Chip status={o.status} /></td>
                  <td style={{ padding: '13px 16px', color: '#9ca3af', fontSize: 12 }}>{safeFormat(o.createdAt, 'dd MMM, HH:mm')}</td>
                  <td style={{ padding: '13px 16px', color: '#9ca3af', fontSize: 11 }}>→</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Panel order={selectedId ? orderDetail : null} onClose={closePanel} onUpdate={(s: string) => upd.mutate({ id: selectedId, status: s })} />
    </div>
  );
}
