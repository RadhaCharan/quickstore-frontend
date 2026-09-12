import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useVendorStore } from '../../store/vendorStore';
import toast from 'react-hot-toast';
import {
  Package, ShoppingBag, Truck, Tag, Users,
  Search, BarChart2, CheckCircle2, Circle,
  ChevronRight, ChevronLeft, Zap, Copy, ExternalLink,
} from 'lucide-react';

const FEATURES = [
  { key: 'PRODUCTS',          icon: Package,    label: 'Product Catalogue',   desc: 'Add, manage and showcase your products' },
  { key: 'ORDERS',            icon: ShoppingBag,label: 'Order Management',     desc: 'Receive and manage customer orders in real-time' },
  { key: 'SEARCH',            icon: Search,     label: 'Search Bar',           desc: 'Let customers search your products instantly' },
  { key: 'CATEGORIES',        icon: Tag,        label: 'Product Categories',   desc: 'Organise products into categories' },
  { key: 'DELIVERY_TRACKING', icon: Truck,      label: 'Delivery Tracking',    desc: 'Assign agents and track deliveries live' },
  { key: 'DISCOUNTS',         icon: Tag,        label: 'Discounts & Coupons',  desc: 'Create coupon codes and run promotions' },
  { key: 'CUSTOMER_ACCOUNTS', icon: Users,      label: 'Customer Accounts',    desc: 'Customers can save addresses and order history' },
  { key: 'ANALYTICS',         icon: BarChart2,  label: 'Analytics Dashboard',  desc: 'View revenue, order trends and top products' },
];

const THEMES = [
  { key: 'QUICKCART', label: 'QuickCart', desc: 'Dark — Blinkit / Zepto style',       accent: '#16a34a', bg: '#111827' },
  { key: 'FRESHMART', label: 'FreshMart', desc: 'Warm — Swiggy / Instamart style',    accent: '#f97316', bg: '#fff8f0' },
  { key: 'STYLEHUB',  label: 'StyleHub',  desc: 'Minimal — Fashion / Boutique',       accent: '#7c3aed', bg: '#fafafa' },
  { key: 'LOCALPRO',  label: 'LocalPro',  desc: 'Professional — Electronics / Tools', accent: '#1d4ed8', bg: '#f8fafc' },
];

const inp: React.CSSProperties = {
  width: '100%', border: '1px solid #d1d5db', borderRadius: 10,
  padding: '10px 14px', fontSize: 14, color: '#111827', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
};

function Steps({ current }: { current: number }) {
  const steps = ['Choose Features', 'Design Store', 'Your Store is Live'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i <= current ? '#16a34a' : '#f3f4f6',
              color: i <= current ? '#fff' : '#9ca3af', fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 12, fontWeight: i === current ? 700 : 400, color: i <= current ? '#111827' : '#9ca3af', whiteSpace: 'nowrap' }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 1.5, background: i < current ? '#16a34a' : '#e5e7eb', margin: '0 10px' }} />}
        </div>
      ))}
    </div>
  );
}

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const { email, tenantSlug, setOnboarded } = useAuthStore();
  const { setVendorConfig } = useVendorStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'PRODUCTS', 'ORDERS', 'SEARCH', 'CATEGORIES',
  ]);

  const [storeForm, setStoreForm] = useState({
    theme: 'QUICKCART', storeName: '', tagline: '',
    primaryColor: '#16a34a', deliveryFee: '20',
    minOrderAmt: '100', freeDeliveryAbove: '500',
  });

  const storeUrl = tenantSlug
    ? `${window.location.origin}/store/${tenantSlug}`
    : `${window.location.origin}/store/yourstore`;

  const toggleFeature = (key: string) =>
    setSelectedFeatures(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const setField = (k: string) => (e: any) =>
    setStoreForm(f => ({ ...f, [k]: e.target.value }));

  const copyUrl = () => { navigator.clipboard.writeText(storeUrl); toast.success('Link copied!'); };

  const whatsappShare = () => {
    const msg = encodeURIComponent(`🛒 Shop from my store — ${storeForm.storeName || 'My Store'}!\n\n${storeUrl}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleCreateWebsite = async () => {
    setSaving(true);
    try {
      await api.patch('/storefront/config', { ...storeForm, enabledFeatures: selectedFeatures });
    } catch (err: any) {
      // Don't block the celebration screen — config can be updated from Settings
      console.warn('Config save failed silently:', err?.response?.data?.message);
    } finally {
      setSaving(false);
      // Always update local store and go to Step 3
      setVendorConfig({ features: selectedFeatures, storeName: storeForm.storeName });
      setStep(2);
    }
  };

  const handleGoToDashboard = () => {
    setOnboarded(true);
    navigate('/vendor/dashboard');
    toast.success('Your store is live! 🎉');
  };

  // ── STEP 0: Choose features ───────────────────────────────────────────────
  const Step0 = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>What do you need for your store?</h2>
      <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 22px' }}>Select the features to include on your website. You can change these later.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {FEATURES.map(f => {
          const Icon = f.icon;
          const active = selectedFeatures.includes(f.key);
          return (
            <button key={f.key} onClick={() => toggleFeature(f.key)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', borderRadius: 12, border: `2px solid ${active ? '#16a34a' : '#e5e7eb'}`, background: active ? '#f0fdf4' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: active ? '#16a34a' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color={active ? '#fff' : '#9ca3af'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {f.label}
                  {active ? <CheckCircle2 size={13} color="#16a34a" /> : <Circle size={13} color="#d1d5db" />}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 20, padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', fontSize: 13, color: '#15803d' }}>
        ✓ <strong>{selectedFeatures.length} features</strong> selected — you can add or remove them anytime from Settings.
      </div>
    </div>
  );

  // ── STEP 1: Design store ──────────────────────────────────────────────────
  const Step1 = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Design your store</h2>
      <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 22px' }}>Pick a theme and add your branding. Your customers will see this.</p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 10 }}>Store Theme</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {THEMES.map(t => {
            const active = storeForm.theme === t.key;
            return (
              <button key={t.key} onClick={() => setStoreForm(f => ({ ...f, theme: t.key, primaryColor: t.accent }))} style={{ border: `2px solid ${active ? t.accent : '#e5e7eb'}`, borderRadius: 12, padding: 12, cursor: 'pointer', textAlign: 'left', background: active ? t.accent + '08' : '#fff' }}>
                <div style={{ height: 44, borderRadius: 8, background: t.bg, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: t.accent, flexShrink: 0 }} />
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: t.accent + '44' }} />
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: t.accent }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{t.label}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{t.desc}</div>
                {active && <div style={{ fontSize: 11, color: t.accent, fontWeight: 600, marginTop: 4 }}>✓ Selected</div>}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { label: 'Store Name *', key: 'storeName', ph: 'e.g. Naresh Kirana Store' },
          { label: 'Tagline',      key: 'tagline',   ph: 'e.g. Fresh products, fast delivery' },
        ].map(({ label, key, ph }) => (
          <div key={key}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>
            <input value={(storeForm as any)[key]} onChange={setField(key)} placeholder={ph} style={inp}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'} />
          </div>
        ))}

        {/* Only show delivery settings if vendor selected delivery */}
        {selectedFeatures.includes('DELIVERY_TRACKING') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Delivery Fee (₹)', key: 'deliveryFee', ph: '20' },
              { label: 'Min Order (₹)',    key: 'minOrderAmt', ph: '100' },
              { label: 'Free Above (₹)',   key: 'freeDeliveryAbove', ph: '500' },
            ].map(({ label, key, ph }) => (
              <div key={key}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>
                <input type="number" value={(storeForm as any)[key]} onChange={setField(key)} placeholder={ph} style={{ ...inp, fontSize: 13 }}
                  onFocus={e => e.target.style.borderColor = '#16a34a'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
            ))}
          </div>
        )}

        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Brand Colour</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={storeForm.primaryColor} onChange={setField('primaryColor')}
              style={{ width: 44, height: 40, borderRadius: 9, border: '1px solid #d1d5db', cursor: 'pointer', padding: 3 }} />
            <code style={{ fontSize: 13, color: '#374151', background: '#f9fafb', padding: '6px 10px', borderRadius: 7, border: '1px solid #e5e7eb' }}>{storeForm.primaryColor}</code>
          </div>
        </div>
      </div>
    </div>
  );

  // ── STEP 2: Store live ────────────────────────────────────────────────────
  const Step2 = (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0fdf4', border: '3px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <span style={{ fontSize: 40 }}>🎉</span>
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Your website is created!</h2>
      <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 28px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
        Share this link with your customers. They can browse products, add to cart, and place orders directly.
      </p>

      {/* Store URL */}
      <div style={{ background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', marginBottom: 16, textAlign: 'left' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Your Store URL</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <code style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#16a34a', wordBreak: 'break-all', fontFamily: 'monospace' }}>{storeUrl}</code>
          <button onClick={copyUrl} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <Copy size={13} /> Copy
          </button>
        </div>
      </div>

      {/* Share actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <a href={storeUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
          <ExternalLink size={14} /> Preview Store
        </a>
        <button
          onClick={whatsappShare}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, border: '1.5px solid #22c55e', background: '#f0fdf4', color: '#16a34a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 16 }}>💬</span> Share on WhatsApp
        </button>
      </div>

      {/* Selected features summary */}
      <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px', textAlign: 'left', border: '1px solid #e5e7eb', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
          Features enabled on your website
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selectedFeatures.map(fKey => {
            const feat = FEATURES.find(x => x.key === fKey);
            return feat ? (
              <span key={fKey} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontWeight: 600 }}>
                ✓ {feat.label}
              </span>
            ) : null;
          })}
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#9ca3af', margin: '12px 0 0' }}>
        WhatsApp integration to automatically send store link on signup — coming soon.
      </p>
    </div>
  );

  const STEPS = [Step0, Step1, Step2];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 700 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, background: '#16a34a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>QuickStore Setup</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Logged in as {email}</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e5e7eb', padding: '28px 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Steps current={step} />
          {STEPS[step]}

          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            {step > 0 && step < 2 ? (
              <button onClick={() => setStep(s => s - 1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #d1d5db', borderRadius: 9, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}>
                <ChevronLeft size={15} /> Back
              </button>
            ) : <div />}

            {step === 0 && (
              <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a', border: 'none', borderRadius: 9, padding: '10px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff' }}>
                Continue <ChevronRight size={15} />
              </button>
            )}

            {step === 1 && (
              <button
                onClick={handleCreateWebsite}
                disabled={saving || !storeForm.storeName.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#16a34a', border: 'none', borderRadius: 9, padding: '11px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff', opacity: !storeForm.storeName.trim() ? 0.5 : 1 }}
              >
                {saving ? 'Creating…' : '🚀 Create My Website'}
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleGoToDashboard}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0f172a', border: 'none', borderRadius: 9, padding: '11px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff' }}
              >
                Go to Dashboard →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
