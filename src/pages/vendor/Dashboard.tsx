import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { ShoppingBag, TrendingUp, Package, Users, Copy, ExternalLink, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { safeFormat } from '../../shared/utils/date';
import { TrendChart, BarList } from '../../components/vendor/Charts';

// Validated with the dataviz skill's palette checker (adjacent-pair mode, as appropriate for
// a fixed-order chip row / bar list): the previous CONFIRMED/PREPARING amber+orange pair was
// ΔE 0.1 apart for deuteranopia — effectively the same color to a colorblind viewer. This
// ordering clears the CVD and normal-vision floors; every status is always shown with its
// text label too; run `validate_palette.js` again before changing any of these six.
const STATUS_COLOR: Record<string, string> = {
  PLACED: '#2a78d6', CONFIRMED: '#eb6834', PREPARING: '#4a3aa7',
  OUT_FOR_DELIVERY: '#eda100', DELIVERED: '#008300', CANCELLED: '#e34948',
};

const STATUS_LABEL: Record<string, string> = {
  PLACED: 'Placed', CONFIRMED: 'Confirmed', PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};

const RANGE_OPTIONS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick }: any) {
  return (
    <div
      onClick={onClick}
      style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: 16, alignItems: 'flex-start', cursor: onClick ? 'pointer' : undefined }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

export default function VendorDashboard() {
  const { tenantSlug } = useAuthStore();
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const storeUrl = tenantSlug
    ? `${window.location.origin}/store/${tenantSlug}`
    : null;

  const copyUrl = () => {
    if (!storeUrl) return;
    navigator.clipboard.writeText(storeUrl);
    toast.success('Store link copied!');
  };

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/orders/analytics/summary').then(r => r.data),
    retry: 1,
  });

  const [rangeDays, setRangeDays] = useState(30);
  const { data: timeseries = [] } = useQuery({
    queryKey: ['analytics-timeseries', rangeDays],
    queryFn: () => api.get('/orders/analytics/timeseries', { params: { days: rangeDays } }).then(r => r.data),
  });
  const rangeRevenue = timeseries.reduce((s: number, d: any) => s + d.revenue, 0);
  const rangeOrders = timeseries.reduce((s: number, d: any) => s + d.orders, 0);

  // Rendered in this fixed order (not sorted by count) — it's the order the palette above
  // was validated against; re-sorting by count would put arbitrary colors next to each
  // other and could reintroduce the confusable pair the ordering was chosen to avoid.
  const STATUS_ORDER = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
  const countByStatus = new Map((analytics?.statusBreakdown ?? []).map((s: any) => [s.status, s.count]));
  const statusItems = STATUS_ORDER
    .filter(status => countByStatus.has(status))
    .map(status => ({ label: STATUS_LABEL[status], value: countByStatus.get(status) as number, color: STATUS_COLOR[status] }));

  // /products already only ever returns is_active products, so its `total` IS the active
  // count — ask for a single row (limit=1) instead of pulling every product just to count
  // them client-side, which silently undercounted anyway once the list was paginated.
  const { data: productsData } = useQuery({
    queryKey: ['products-count'],
    queryFn: () => api.get('/products', { params: { limit: 1 } }).then(r => r.data),
  });
  const activeProducts = productsData?.total ?? 0;

  return (
    <div style={{ padding: 28, fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>{greeting} 👋</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      {/* Store URL share panel */}
      {storeUrl && (
        <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac', borderRadius: 14, padding: '18px 22px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>🟢 Your Store is Live</div>
            <code style={{ fontSize: 14, fontWeight: 700, color: '#15803d', fontFamily: 'monospace' }}>{storeUrl}</code>
            <div style={{ fontSize: 12, color: '#16a34a', marginTop: 3 }}>Share this link with your customers</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyUrl} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #86efac', borderRadius: 9, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#15803d' }}>
              <Copy size={13} /> Copy Link
            </button>
            <a href={storeUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a', border: 'none', borderRadius: 9, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
              <ExternalLink size={13} /> Open Store
            </a>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={ShoppingBag}  label="Orders Today"    value={analytics?.todayOrders ?? 0}                     color="#3b82f6" onClick={() => navigate('/vendor/orders')} />
        <StatCard icon={TrendingUp}   label="Revenue Today"   value={analytics ? `₹${analytics.todayRevenue}` : '₹0'} color="#16a34a" onClick={() => navigate('/vendor/orders')} />
        <StatCard icon={Package}      label="Active Products" value={activeProducts}                                    color="#8b5cf6" onClick={() => navigate('/vendor/products')} />
        <StatCard icon={Users}        label="Total Customers" value={analytics?.totalCustomers ?? 0}                   color="#f97316" onClick={() => navigate('/vendor/customers')} />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: '+ Add Product',     href: '/vendor/products',  color: '#16a34a', bg: '#f0fdf4',  icon: '📦' },
          { label: 'View Orders',       href: '/vendor/orders',    color: '#3b82f6', bg: '#eff6ff',  icon: '🛍️' },
          { label: 'Add Discount',      href: '/vendor/discounts', color: '#7c3aed', bg: '#f5f3ff',  icon: '🏷️' },
          { label: 'Add / Remove Features', href: '/vendor/features',  color: '#f97316', bg: '#fff7ed',  icon: '🧩' },
        ].map(({ label, href, color, bg, icon }) => (
          <a key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 8, background: bg, border: `1px solid ${color}22`, borderRadius: 12, padding: '13px 16px', textDecoration: 'none', color, fontWeight: 600, fontSize: 12 }}>
            <span style={{ fontSize: 16 }}>{icon}</span> {label}
          </a>
        ))}
      </div>

      {/* Trends */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Trends</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.days}
              onClick={() => setRangeDays(opt.days)}
              style={{
                padding: '6px 12px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: rangeDays === opt.days ? '#0f172a' : '#f1f5f9',
                color: rangeDays === opt.days ? '#fff' : '#374151',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24, alignItems: 'stretch' }}>
        <ChartCard title="Revenue" subtitle={`₹${rangeRevenue.toLocaleString('en-IN')} over last ${rangeDays} days`}>
          <TrendChart data={timeseries.map((d: any) => ({ date: d.date, value: d.revenue }))} color="#16a34a" formatValue={(v) => `₹${v.toLocaleString('en-IN')}`} />
        </ChartCard>
        <ChartCard title="Orders" subtitle={`${rangeOrders} orders over last ${rangeDays} days`}>
          <TrendChart data={timeseries.map((d: any) => ({ date: d.date, value: d.orders }))} color="#3b82f6" formatValue={(v) => `${v} order${v === 1 ? '' : 's'}`} />
        </ChartCard>
        <ChartCard title="Orders by Status" subtitle="All-time">
          {statusItems.length === 0
            ? <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>No orders yet.</p>
            : <BarList items={statusItems} />}
        </ChartCard>
      </div>

      {/* Recent orders table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Recent Orders</h2>
          <a href="/vendor/orders" style={{ fontSize: 13, color: '#16a34a', fontWeight: 500, textDecoration: 'none' }}>View all →</a>
        </div>
        {!analytics?.recentOrders?.length ? (
          <div style={{ padding: '48px 22px', textAlign: 'center' }}>
            <ShoppingBag size={36} color="#d1d5db" style={{ display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>No orders yet.</p>
            <p style={{ color: '#d1d5db', fontSize: 12, margin: '6px 0 0' }}>
              Share your store link and start getting orders: <strong style={{ color: '#16a34a' }}>{storeUrl}</strong>
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['Order #', 'Customer', 'Total', 'Payment', 'Status', 'Time'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analytics.recentOrders.map((o: any) => (
                <tr key={o.id} onClick={() => navigate(`/vendor/orders?orderId=${o.id}`)} style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#111827' }}>#{o.orderNumber}</td>
                  <td style={{ padding: '12px 16px', color: '#374151' }}>{o.customerName || o.customerPhone || '—'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#16a34a' }}>₹{o.total}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: o.paymentStatus === 'PAID' ? '#dcfce7' : '#f3f4f6', color: o.paymentStatus === 'PAID' ? '#16a34a' : '#6b7280', fontWeight: 500 }}>
                      {o.paymentMode}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: (STATUS_COLOR[o.status] || '#6b7280') + '18', color: STATUS_COLOR[o.status] || '#6b7280', fontWeight: 500 }}>
                      {STATUS_LABEL[o.status] || o.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{safeFormat(o.createdAt, 'HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
