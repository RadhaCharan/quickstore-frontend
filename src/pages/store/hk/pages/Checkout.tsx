import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPaise, type StorefrontBootstrap } from '../types';
import { api, ApiError } from '../api/client';
import { useCart } from '../state/cart';
import { useAccount } from '../state/useAccount';
import { Sheet } from '../components/Sheet';
import { AccountPanel } from '../components/AccountPanel';

interface AppliedCoupon {
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  minOrderAmtPaise: number;
  maxDiscountPaise: number | null;
}

function couponLabel(a: AppliedCoupon): string {
  return a.type === 'PERCENTAGE' ? `${a.value}% off` : `${formatPaise(Math.round(a.value * 100))} off`;
}

export function Checkout({ boot, base }: { boot: StorefrontBootstrap; base: string }) {
  const cart = useCart();
  const account = useAccount();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [form, setForm] = useState({ phone: '', name: '', line1: '', line2: '', city: '', pincode: '', notes: '' });

  // Coupon — we keep the coupon's type/value/caps (not a frozen discount amount) and
  // recompute the actual discount live as the cart changes, the same way the backend does,
  // so bumping a quantity up or down keeps the shown discount honest instead of stale.
  const [coupon, setCoupon] = useState('');
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);

  // Sign-in gate — checkout requires an account, so we ask for it right before placing
  // the order instead of failing with a raw "Invalid or expired token" from the API.
  const [loginOpen, setLoginOpen] = useState(false);
  const [autoPlace, setAutoPlace] = useState(false);

  useEffect(() => {
    if (!account.customer) return;
    setForm(f => ({ ...f, phone: f.phone || account.customer!.phone, name: f.name || account.customer!.name || '' }));
  }, [account.customer]);

  // Once sign-in completes (token appears) while we were waiting on it, finish placing the order.
  useEffect(() => {
    if (autoPlace && account.token) {
      setAutoPlace(false);
      setLoginOpen(false);
      placeOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlace, account.token]);

  function useAddress(id: string) {
    const a = account.addresses.find(x => x.id === id);
    if (!a) return;
    setSelectedAddressId(id);
    setForm(f => ({ ...f, line1: a.line1, line2: a.line2 ?? '', city: a.city, pincode: a.pincode }));
  }

  if (cart.lines.length === 0) return (
    <div className="empty">
      <h2>Your cart is empty</h2>
      <p>Add a few things and come back.</p>
      <button className="btn" onClick={() => navigate(base)}>Browse the store</button>
    </div>
  );

  const subtotalPaise = cart.subtotalPaise;

  // Recomputed from the coupon's own rules on every render (qty +/-, item removed, …) —
  // never a value frozen at the moment "Apply" was clicked.
  const discountPaise = useMemo(() => {
    if (!applied || subtotalPaise < applied.minOrderAmtPaise) return 0;
    if (applied.type === 'PERCENTAGE') {
      const raw = Math.round((subtotalPaise * applied.value) / 100);
      return applied.maxDiscountPaise != null ? Math.min(raw, applied.maxDiscountPaise) : raw;
    }
    return Math.min(Math.round(applied.value * 100), subtotalPaise);
  }, [applied, subtotalPaise]);

  const totalPaise = subtotalPaise + boot.store.deliveryFeePaise - discountPaise;

  // If the cart shrinks below the coupon's minimum order value, drop it instead of silently
  // showing ₹0 off (or letting the order fail at place-order time with a confusing error).
  useEffect(() => {
    if (applied && subtotalPaise < applied.minOrderAmtPaise) {
      setCouponError(`Removed ${applied.code} — this coupon needs an order of at least ${formatPaise(applied.minOrderAmtPaise)}.`);
      setApplied(null);
      setCoupon('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotalPaise]);

  async function applyCoupon() {
    if (!coupon.trim()) return;
    setCouponError(null); setCouponApplying(true);
    try {
      const r = await api.applyCoupon(coupon.trim().toUpperCase(), subtotalPaise);
      setApplied({ code: r.code, type: r.type, value: r.value, minOrderAmtPaise: r.minOrderAmtPaise, maxDiscountPaise: r.maxDiscountPaise });
    } catch (e) {
      setApplied(null);
      setCouponError(e instanceof ApiError ? e.message : 'Invalid or expired coupon code.');
    } finally {
      setCouponApplying(false);
    }
  }

  async function placeOrder() {
    if (!account.token) {
      // Park the intent to place the order and open the sign-in sheet; the effect above
      // resumes checkout automatically the moment the OTP sign-in succeeds.
      setAutoPlace(true);
      setLoginOpen(true);
      return;
    }
    setSubmitting(true); setError(null);
    try {
      const result = await api.checkout({
        phone: form.phone, name: form.name || undefined,
        address: { line1: form.line1, line2: form.line2 || undefined, city: form.city, pincode: form.pincode },
        lines: cart.lines.map(l => ({ productId: l.productId, qty: l.qty })),
        couponCode: applied?.code,
        notes: form.notes || undefined,
      });
      cart.clear();
      navigate(`${base}/order/${result.code}`, { state: { justPlaced: true } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not place the order. Try again.');
      setSubmitting(false);
    }
  }

  const ready = form.phone.length >= 10 && form.line1.trim().length > 3 && form.city.trim().length > 1;

  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate(base)}>← Back to shop</button>
      <h1>Checkout</h1>
      <p className="page__lede">Delivered by {boot.store.storeName}</p>

      {error && <div className="notice notice--error">{error}</div>}

      <div className="summary">
        {cart.lines.map(line => (
          <div key={line.productId} className="summary__row summary__row--line">
            <span className="summary__item">
              <span className="summary__thumb">{line.image ? <img src={line.image} alt="" /> : <span>🛍️</span>}</span>
              <span className="summary__name">{line.name}</span>
            </span>
            <div className="stepper">
              <button onClick={() => cart.setQty(line.productId, line.qty - 1)}>−</button>
              <span>{line.qty}</span>
              <button onClick={() => cart.setQty(line.productId, line.qty + 1)}>+</button>
            </div>
            <span className="summary__line-total">{formatPaise(line.pricePaise * line.qty)}</span>
          </div>
        ))}
        <div className="summary__row">
          <span>Delivery</span>
          <span>{formatPaise(boot.store.deliveryFeePaise)}</span>
        </div>
        {applied && discountPaise > 0 && (
          <div className="summary__row">
            <span style={{ color: 'var(--vs-success)' }}>🏷️ {applied.code} · {couponLabel(applied)}</span>
            <span style={{ color: 'var(--vs-success)', fontWeight: 700 }}>−{formatPaise(discountPaise)}</span>
          </div>
        )}
        <div className="summary__row summary__row--total">
          <span>Total</span>
          <span>{formatPaise(totalPaise)}</span>
        </div>
      </div>

      <label className="field"><span>Coupon code</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={coupon} onChange={e => { setCoupon(e.target.value.toUpperCase()); setApplied(null); }} placeholder="SAVE20" style={{ flex: 1 }} />
          <button className="btn btn--ghost" type="button" disabled={couponApplying || !coupon.trim()} onClick={applyCoupon} style={{ flexShrink: 0 }}>
            {couponApplying ? 'Checking…' : 'Apply'}
          </button>
        </div>
        {couponError && <span className="notice notice--error" style={{ display: 'block', marginTop: 6 }}>{couponError}</span>}
        {applied && !couponError && (
          <span style={{ display: 'block', marginTop: 6, color: 'var(--vs-success)', fontSize: 13 }}>
            {applied.code} applied ({couponLabel(applied)}) — you saved {formatPaise(discountPaise)}!
          </span>
        )}
      </label>

      <label className="field"><span>Mobile number</span>
        <input inputMode="numeric" maxLength={10} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} placeholder="10-digit number" />
      </label>
      <label className="field"><span>Name</span>
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Who should we ask for?" />
      </label>

      {account.customer && account.addresses.length > 0 && (
        <div className="address-chips">
          {account.addresses.map(a => (
            <button key={a.id} className="chip" aria-pressed={selectedAddressId === a.id} onClick={() => useAddress(a.id)}>{a.label}</button>
          ))}
        </div>
      )}

      <label className="field"><span>Address *</span>
        <input value={form.line1} onChange={e => setForm({ ...form, line1: e.target.value })} placeholder="House or flat, street" />
      </label>
      <label className="field"><span>Landmark</span>
        <input value={form.line2} onChange={e => setForm({ ...form, line2: e.target.value })} placeholder="Near the temple…" />
      </label>
      <div className="field--pair">
        <label className="field"><span>City *</span><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></label>
        <label className="field"><span>PIN code</span><input inputMode="numeric" maxLength={6} value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} /></label>
      </div>
      <label className="field"><span>Note for the shop</span>
        <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Ring the bell twice" />
      </label>

      {!account.customer && (
        <p className="page__lede" style={{ marginTop: -4, marginBottom: 12 }}>
          You'll be asked to sign in with your mobile number before we place the order.
        </p>
      )}

      <button className="btn btn--block" disabled={!ready || submitting} onClick={placeOrder}>
        {submitting ? 'Placing order…' : account.customer ? 'Place order' : 'Sign in & place order'}
      </button>

      <Sheet open={loginOpen} onClose={() => { setLoginOpen(false); setAutoPlace(false); }} labelledBy="account-panel-title">
        <AccountPanel onClose={() => { setLoginOpen(false); setAutoPlace(false); }} base={base} />
      </Sheet>
    </div>
  );
}
