import './store.css';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { tenantApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

type PayMode = 'COD' | 'RAZORPAY';

export default function StoreCheckout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { items, total, clearCart } = useCartStore();
  const { token } = useAuthStore();

  const [address, setAddress] = useState({ line1: '', city: '', pincode: '' });
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [payMode, setPayMode] = useState<PayMode>('COD');
  const [placing, setPlacing] = useState(false);
  const [couponErr, setCouponErr] = useState('');

  const sub   = total();
  const grand = sub - discount;

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress(a => ({ ...a, [k]: e.target.value }));

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponErr('');
    try {
      const { data } = await tenantApi(slug!).post('/discounts/apply', { code: coupon.trim().toUpperCase(), orderAmount: sub });
      setDiscount(data.discountAmount || 0);
      toast.success(`Saved ₹${data.discountAmount}!`);
    } catch {
      setCouponErr('Invalid or expired coupon code.');
    }
  };

  const placeOrder = async () => {
    if (!token) { navigate(`/store/${slug}/login`); return; }
    if (!address.line1 || !address.city) { toast.error('Enter delivery address'); return; }
    setPlacing(true);
    try {
      const { data } = await tenantApi(slug!).post('/orders', {
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        paymentMode: payMode,
        address,
        couponCode: coupon || undefined,
      });
      clearCart();
      navigate(`/store/${slug}/order/${data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) return (
    <div className="page" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <p style={{ fontSize: 48, margin: '0 0 12px' }}>🛒</p>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Your cart is empty</h1>
      <p className="page__lede">Add some products before checkout.</p>
      <button className="btn" onClick={() => navigate(`/store/${slug}`)}>Browse Products</button>
    </div>
  );

  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate(`/store/${slug}`)}>← Back to store</button>
      <h1>Checkout</h1>
      <p className="page__lede">{items.length} item{items.length > 1 ? 's' : ''} in your cart</p>

      {/* Order summary */}
      <div className="summary">
        {items.map(item => (
          <div key={item.productId} className="summary__row summary__row--line">
            <div className="summary__item">
              <div className="summary__thumb">
                {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : '📦'}
              </div>
              <span className="summary__name">{item.name}</span>
              <span className="summary__meta">× {item.quantity}</span>
            </div>
            <span className="summary__line-total">₹{(item.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}
        {discount > 0 && (
          <div className="summary__row">
            <span style={{ color: 'var(--vs-success)' }}>🏷️ Discount</span>
            <span style={{ color: 'var(--vs-success)', fontWeight: 700 }}>−₹{discount}</span>
          </div>
        )}
        <div className="summary__row summary__row--total">
          <span>Total</span>
          <span>₹{grand.toFixed(0)}</span>
        </div>
      </div>

      {/* Coupon */}
      <label className="field">
        <span>Coupon code</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="SAVE20" style={{ flex: 1 }} />
          <button className="btn btn--ghost" onClick={applyCoupon} style={{ flexShrink: 0 }}>Apply</button>
        </div>
        {couponErr && <span className="notice notice--error" style={{ display: 'block', marginTop: 6 }}>{couponErr}</span>}
      </label>

      {/* Address */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Delivery Address</h2>
      <label className="field"><span>Address line *</span><input value={address.line1} onChange={set('line1')} placeholder="House no., street, area…" /></label>
      <div className="field field--pair">
        <label><span>City *</span><input value={address.city} onChange={set('city')} placeholder="Pune" /></label>
        <label><span>Pincode</span><input value={address.pincode} onChange={set('pincode')} placeholder="411001" /></label>
      </div>

      {/* Payment */}
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: '16px 0 12px' }}>Payment</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {(['COD', 'RAZORPAY'] as PayMode[]).map(m => (
          <button key={m} onClick={() => setPayMode(m)}
            className={m === payMode ? 'btn' : 'btn btn--ghost'}
            style={{ padding: '12px', fontSize: 13 }}
          >
            {m === 'COD' ? '💵 Cash on Delivery' : '💳 Pay Online'}
          </button>
        ))}
      </div>

      <button className="btn btn--block" onClick={placeOrder} disabled={placing}>
        {placing ? 'Placing order…' : `Place Order · ₹${grand.toFixed(0)}`}
      </button>
    </div>
  );
}
