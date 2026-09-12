import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useVendorStore } from '../../store/vendorStore';
import { Package, ShoppingBag, Truck, Tag, Users, Search, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

const THEMES = [
  { key: 'QUICKCART', label: 'QuickCart', desc: 'Dark — Blinkit / Zepto', best: 'Grocery, Kirana', color: '#16a34a', bg: '#111827' },
  { key: 'FRESHMART', label: 'FreshMart', desc: 'Warm — Swiggy / Instamart', best: 'Food, Dairy', color: '#f97316', bg: '#fff8f0' },
  { key: 'STYLEHUB',  label: 'StyleHub',  desc: 'Minimal — Fashion', best: 'Boutique, Apparel', color: '#7c3aed', bg: '#fafafa' },
  { key: 'LOCALPRO',  label: 'LocalPro',  desc: 'Professional — B2B', best: 'Electronics, Hardware', color: '#1d4ed8', bg: '#f8fafc' },
];

const ALL_FEATURES = [
  { key: 'PRODUCTS',          icon: Package,    label: 'Product Catalogue',  desc: 'Add, edit, delete products and update prices/stock' },
  { key: 'ORDERS',            icon: ShoppingBag,label: 'Order Management',    desc: 'View, manage and update order status' },
  { key: 'SEARCH',            icon: Search,     label: 'Search Bar',          desc: 'Search bar on your customer store' },
  { key: 'CATEGORIES',        icon: Tag,        label: 'Product Categories',  desc: 'Organise products into categories' },
  { key: 'DELIVERY_TRACKING', icon: Truck,      label: 'Delivery Tracking',   desc: 'Assign delivery agents, track orders live' },
  { key: 'DISCOUNTS',         icon: Tag,        label: 'Discounts & Coupons', desc: 'Coupon codes and promotional discounts' },
  { key: 'CUSTOMER_ACCOUNTS', icon: Users,      label: 'Customer Accounts',   desc: 'Customers save address and view order history' },
  { key: 'ANALYTICS',         icon: BarChart2,  label: 'Analytics',           desc: 'Revenue, order trends and top products' },
];

const inp: React.CSSProperties = { width: '100%', border: '1px solid #d1d5db', borderRadius: 9, padding: '9px 13px', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

function Section({ title, subtitle, children }: any) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', marginBottom: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9' }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</h2>
        {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6b7280' }}>{subtitle}</p>}
      </div>
      <div style={{ padding: '18px 22px' }}>{children}</div>
    </div>
  );
}

export default function VendorSettings() {
  const qc = useQueryClient();
  const { features: storeFeatures, setVendorConfig } = useVendorStore();
  const [form, setForm] = useState({ theme: 'QUICKCART', storeName: '', tagline: '', primaryColor: '#16a34a', contactPhone: '', deliveryFee: '', minOrderAmount: '', freeDeliveryAbove: '' });
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>(storeFeatures);

  useQuery({
    queryKey: ['storefront-config'],
    queryFn: () => api.get('/storefront/config').then(r => r.data),
    onSuccess: (d: any) => {
      if (d?.config) setForm(f => ({ ...f, ...d.config }));
      if (d?.features) setEnabledFeatures(d.features);
    },
  });

  const saveAll = useMutation({
    mutationFn: () => api.patch('/storefront/config', { ...form, enabledFeatures }),
    onSuccess: () => {
      setVendorConfig({ features: enabledFeatures });
      qc.invalidateQueries({ queryKey: ['storefront-config'] });
      toast.success('Settings saved! Changes are live on your store.');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const setF = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleFeature = (key: string) =>
    setEnabledFeatures(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );

  return (
    <div style={{ padding: 28, fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Store Settings</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Changes save instantly to your live store</p>
      </div>

      {/* ── FEATURES ── */}
      <Section title="Features" subtitle="Enable or disable features on your store. Disabled features are hidden from your admin and customer website.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ALL_FEATURES.map(f => {
            const Icon = f.icon;
            const on = enabledFeatures.includes(f.key);
            return (
              <button
                key={f.key}
                onClick={() => toggleFeature(f.key)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 12, border: `2px solid ${on ? '#16a34a' : '#e5e7eb'}`, background: on ? '#f0fdf4' : '#fafafa', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 8, background: on ? '#16a34a' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={on ? '#fff' : '#9ca3af'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.label}</span>
                    <div style={{ width: 36, height: 20, borderRadius: 10, background: on ? '#16a34a' : '#d1d5db', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: on ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>{f.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12, marginBottom: 0 }}>
          ⚡ Changes take effect immediately on your store when you save below.
        </p>
      </Section>

      {/* ── THEME ── */}
      <Section title="Store Theme" subtitle="This is what your customers see.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {THEMES.map(t => {
            const active = form.theme === t.key;
            return (
              <button key={t.key} onClick={() => setForm(f => ({ ...f, theme: t.key, primaryColor: t.color }))} style={{ border: `2px solid ${active ? t.color : '#e5e7eb'}`, borderRadius: 12, padding: 12, cursor: 'pointer', textAlign: 'left', background: active ? t.color + '08' : '#fff' }}>
                <div style={{ height: 36, borderRadius: 8, background: t.bg, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', border: '1px solid #e5e7eb' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: t.color }} />
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: t.color + '44' }} />
                  <div style={{ width: 16, height: 16, borderRadius: 3, background: t.color }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{t.label}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{t.desc} · {t.best}</div>
                {active && <div style={{ fontSize: 11, color: t.color, fontWeight: 700, marginTop: 4 }}>✓ Selected</div>}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── STORE INFO ── */}
      <Section title="Store Information">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[{ label: 'Store Name', k: 'storeName', ph: 'e.g. Ramesh Kirana' }, { label: 'Tagline', k: 'tagline', ph: 'e.g. Fresh products, fast delivery' }, { label: 'Contact Phone', k: 'contactPhone', ph: '+91 98765 43210' }].map(({ label, k, ph }) => (
            <div key={k}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>
              <input value={(form as any)[k] || ''} onChange={setF(k)} placeholder={ph} style={inp} onFocus={e => e.target.style.borderColor='#16a34a'} onBlur={e => e.target.style.borderColor='#d1d5db'} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Brand Colour</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={form.primaryColor} onChange={setF('primaryColor')} style={{ width: 42, height: 38, borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer', padding: 3 }} />
              <code style={{ fontSize: 13, color: '#374151', background: '#f9fafb', padding: '6px 10px', borderRadius: 7, border: '1px solid #e5e7eb' }}>{form.primaryColor}</code>
            </div>
          </div>
        </div>
      </Section>

      {/* ── DELIVERY (only if DELIVERY enabled) ── */}
      {enabledFeatures.includes('DELIVERY_TRACKING') && (
        <Section title="Delivery Settings" subtitle="Shown on your customer store.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[{ label: 'Delivery Fee (₹)', k: 'deliveryFee', ph: '20' }, { label: 'Min Order (₹)', k: 'minOrderAmount', ph: '100' }, { label: 'Free Above (₹)', k: 'freeDeliveryAbove', ph: '500' }].map(({ label, k, ph }) => (
              <div key={k}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>
                <input type="number" value={(form as any)[k] || ''} onChange={setF(k)} placeholder={ph} style={{ ...inp, fontSize: 13 }} onFocus={e => e.target.style.borderColor='#16a34a'} onBlur={e => e.target.style.borderColor='#d1d5db'} />
              </div>
            ))}
          </div>
        </Section>
      )}

      <button
        onClick={() => saveAll.mutate()}
        disabled={saveAll.isPending}
        style={{ width: '100%', background: saveAll.isPending ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
      >
        {saveAll.isPending ? 'Saving…' : '💾 Save All Settings'}
      </button>
    </div>
  );
}
