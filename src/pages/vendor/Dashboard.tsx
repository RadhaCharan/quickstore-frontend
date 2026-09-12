import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { ShoppingBag, TrendingUp, Package, Users, Copy, ExternalLink, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLOR: Record<string, string> = {
  PLACED: '#3b82f6', CONFIRMED: '#f59e0b', PREPARING: '#f97316',
  OUT_FOR_DELIVERY: '#8b5cf6', DELIVERED: '#16a34a', CANCELLED: '#ef4444',
};

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
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

  const { data: productsData } = useQuery({
    queryKey: ['products-count'],
    queryFn: () => api.get('/products').then(r => r.data),
  });
  const activeProducts = Array.isArray(productsData)
    ? productsData.filter((p: any) => p.isActive).length
    : (productsData?.items?.filter((p: any) => p.isActive).length ?? 0);

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
        <StatCard icon={ShoppingBag}  label="Orders Today"    value={analytics?.todayOrders ?? 0}                     color="#3b82f6" />
        <StatCard icon={TrendingUp}   label="Revenue Today"   value={analytics ? `₹${analytics.todayRevenue}` : '₹0'} color="#16a34a" />
        <StatCard icon={Package}      label="Active Products" value={activeProducts}                                    color="#8b5cf6" />
        <StatCard icon={Users}        label="Total Customers" value={analytics?.totalCustomers ?? 0}                   color="#f97316" />
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
                <tr key={o.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#111827' }}>#{o.orderNumber}</td>
                  <td style={{ padding: '12px 16px', color: '#374151' }}>{o.customerPhone || '—'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#16a34a' }}>₹{o.total}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: o.paymentStatus === 'PAID' ? '#dcfce7' : '#f3f4f6', color: o.paymentStatus === 'PAID' ? '#16a34a' : '#6b7280', fontWeight: 500 }}>
                      {o.paymentMode}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: (STATUS_COLOR[o.status] || '#6b7280') + '18', color: STATUS_COLOR[o.status] || '#6b7280', fontWeight: 500 }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{o.createdAt ? format(new Date(o.createdAt), 'HH:mm') : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
