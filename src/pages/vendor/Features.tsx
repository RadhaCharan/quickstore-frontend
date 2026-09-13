import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useVendorStore } from '../../store/vendorStore';
import {
  Package, ShoppingBag, Truck, Tag, Users,
  Search, BarChart2, CheckCircle2, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ALL_FEATURES = [
  {
    key: 'PRODUCTS',
    icon: Package,
    label: 'Product Catalogue',
    desc: 'Add, edit, delete products. Update prices and stock in real-time.',
    impact: 'Products page in your admin + product grid on your customer website',
    color: '#8b5cf6',
    core: true,
  },
  {
    key: 'ORDERS',
    icon: ShoppingBag,
    label: 'Order Management',
    desc: 'Customers can place orders. View, confirm, and track every order.',
    impact: 'Orders page in your admin + checkout flow on your website',
    color: '#3b82f6',
    core: true,
  },
  {
    key: 'SEARCH',
    icon: Search,
    label: 'Search Bar',
    desc: 'Let customers search your products by name instantly.',
    impact: 'Search input appears on your customer website header',
    color: '#0ea5e9',
    core: false,
  },
  {
    key: 'CATEGORIES',
    icon: Tag,
    label: 'Product Categories',
    desc: 'Group products into categories for easier browsing.',
    impact: 'Category icons section appears on your customer website',
    color: '#f59e0b',
    core: false,
  },
  {
    key: 'DELIVERY_TRACKING',
    icon: Truck,
    label: 'Delivery Tracking',
    desc: 'Add delivery agents, assign orders, track live delivery status.',
    impact: 'Delivery page in your admin + delivery info on your website',
    color: '#10b981',
    core: false,
  },
  {
    key: 'DISCOUNTS',
    icon: Tag,
    label: 'Discounts & Coupons',
    desc: 'Create coupon codes. Set % off or flat discount, usage limits, expiry.',
    impact: 'Discounts page in your admin + coupon input at checkout',
    color: '#ef4444',
    core: false,
  },
  {
    key: 'CUSTOMER_ACCOUNTS',
    icon: Users,
    label: 'Customer Accounts',
    desc: 'Customers can register, save multiple addresses, view order history.',
    impact: 'Customers page in your admin + login option on your website',
    color: '#f97316',
    core: false,
  },
  {
    key: 'ANALYTICS',
    icon: BarChart2,
    label: 'Analytics Dashboard',
    desc: 'View today\'s revenue, top products, order trends and customer stats.',
    impact: 'Analytics cards on your vendor dashboard',
    color: '#6366f1',
    core: false,
  },
];

export default function VendorFeatures() {
  const qc = useQueryClient();
  const { features: storeFeatures, setVendorConfig } = useVendorStore();
  const [enabled, setEnabled] = useState<string[]>(storeFeatures);
  const [saving, setSaving] = useState<string | null>(null); // which feature is being toggled

  // Load current features from backend on mount. React Query v5 dropped the `onSuccess`
  // query option (it's silently ignored, never fires) — react to `data` via an effect instead.
  const { data: featuresData } = useQuery({
    queryKey: ['vendor-features'],
    queryFn: () => api.get('/tenant/features').then(r => r.data),
  });

  useEffect(() => {
    if (!featuresData) return;
    const keys = featuresData.filter((f: any) => f.enabled !== false).map((f: any) => f.feature || f);
    setEnabled(keys);
  }, [featuresData]);

  const toggleFeature = useMutation({
    mutationFn: async (key: string) => {
      const isOn = enabled.includes(key);
      const newEnabled = isOn ? enabled.filter(k => k !== key) : [...enabled, key];
      setSaving(key);
      await api.patch('/storefront/config', { enabledFeatures: newEnabled });
      return newEnabled;
    },
    onSuccess: (newEnabled, key) => {
      const wasOn = storeFeatures.includes(key);
      setEnabled(newEnabled);
      setVendorConfig({ features: newEnabled });
      qc.invalidateQueries({ queryKey: ['vendor-features'] });
      const feature = ALL_FEATURES.find(f => f.key === key);
      if (wasOn) {
        toast(`${feature?.label} disabled`, { icon: '⭕', duration: 2500 });
      } else {
        toast.success(`${feature?.label} enabled — live on your store!`, { duration: 3000 });
      }
    },
    onError: () => toast.error('Failed to update. Try again.'),
    onSettled: () => setSaving(null),
  });

  const activeCount = enabled.length;

  return (
    <div style={{ padding: 28, fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 860 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Manage Features</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '5px 0 0' }}>
          Toggle features on or off — changes go live on your store <strong>instantly</strong>, no restart needed.
        </p>
      </div>

      {/* Status bar */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={18} color="#16a34a" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#15803d' }}>
            {activeCount} feature{activeCount !== 1 ? 's' : ''} active on your store
          </span>
        </div>
        <a
          href={`/store/${useVendorStore.getState().slug || 'yourstore'}`}
          target="_blank"
          rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#15803d', fontWeight: 600, textDecoration: 'none' }}
        >
          <ExternalLink size={13} /> View Store
        </a>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {ALL_FEATURES.map(f => {
          const Icon = f.icon;
          const on = enabled.includes(f.key);
          const isSaving = saving === f.key;

          return (
            <div
              key={f.key}
              style={{
                background: '#fff',
                borderRadius: 16,
                border: `2px solid ${on ? f.color + '40' : '#e5e7eb'}`,
                padding: '18px 20px',
                boxShadow: on ? `0 2px 12px ${f.color}18` : '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.2s',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: on ? f.color : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                    <Icon size={18} color={on ? '#fff' : '#9ca3af'} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{f.label}</div>
                    {f.core && <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600, background: '#f0fdf4', borderRadius: 4, padding: '1px 6px', display: 'inline-block', marginTop: 2 }}>CORE</div>}
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => !isSaving && toggleFeature.mutate(f.key)}
                  disabled={isSaving}
                  style={{ background: 'none', border: 'none', cursor: isSaving ? 'wait' : 'pointer', padding: 0 }}
                >
                  <div style={{
                    width: 46, height: 26, borderRadius: 13,
                    background: on ? f.color : '#d1d5db',
                    position: 'relative', transition: 'background 0.25s',
                    opacity: isSaving ? 0.6 : 1,
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 3,
                      left: on ? 23 : 3,
                      transition: 'left 0.25s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    }} />
                  </div>
                </button>
              </div>

              {/* Description */}
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px', lineHeight: 1.5 }}>{f.desc}</p>

              {/* Impact */}
              <div style={{ padding: '8px 10px', background: on ? f.color + '0c' : '#f9fafb', borderRadius: 8, border: `1px solid ${on ? f.color + '30' : '#f1f5f9'}` }}>
                <div style={{ fontSize: 11, color: on ? f.color : '#9ca3af', fontWeight: 500 }}>
                  {on ? '✓ Active' : '○ Off'} — {f.impact}
                </div>
              </div>

              {isSaving && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
                  Updating…
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280' }}>
        💡 <strong>How it works:</strong> Each feature you enable instantly appears in your admin sidebar and on your customer store. Disabled features are hidden from both — your existing data (products, orders, etc.) is always kept safe.
      </div>
    </div>
  );
}
