import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPaise, type StorefrontBootstrap } from '../types';
import { api, ApiError } from '../api/client';
import { useCart } from '../state/cart';
import { useAccount } from '../state/useAccount';

export function Checkout({ boot, base }: { boot: StorefrontBootstrap; base: string }) {
  const cart = useCart();
  const account = useAccount();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [form, setForm] = useState({ phone: '', name: '', line1: '', line2: '', city: '', pincode: '', notes: '' });

  useEffect(() => {
    if (!account.customer) return;
    setForm(f => ({ ...f, phone: f.phone || account.customer!.phone, name: f.name || account.customer!.name || '' }));
  }, [account.customer]);

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

  async function placeOrder() {
    setSubmitting(true); setError(null);
    try {
      const result = await api.checkout({
        phone: form.phone, name: form.name || undefined,
        address: { line1: form.line1, line2: form.line2 || undefined, city: form.city, pincode: form.pincode },
        lines: cart.lines.map(l => ({ productId: l.productId, qty: l.qty })),
        notes: form.notes || undefined,
      });
      cart.clear();
      navigate(`${base}/order/${result.code}`);
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
        <div className="summary__row summary__row--total">
          <span>Total</span>
          <span>{formatPaise(cart.subtotalPaise + boot.store.deliveryFeePaise)}</span>
        </div>
      </div>

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

      <button className="btn btn--block" disabled={!ready || submitting} onClick={placeOrder}>
        {submitting ? 'Placing order…' : 'Place order'}
      </button>
    </div>
  );
}
