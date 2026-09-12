import { useEffect, useState } from 'react';
import { formatPaise } from '../types';
import { useAccount } from '../state/useAccount';
import { ApiError } from '../api/client';

const STATUS_LABEL: Record<string, string> = {
  placed: 'Placed', confirmed: 'Confirmed', packed: 'Packed',
  out_for_delivery: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};

export function AccountPanel({ onClose }: { onClose: () => void }) {
  const account = useAccount();
  return (
    <div>
      <div className="sheet__header">
        <h2 id="account-panel-title">{account.customer ? 'Your account' : 'Sign in'}</h2>
        <button className="sheet__close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      {account.customer ? <LoggedIn onClose={onClose} /> : <LoginForm />}
    </div>
  );
}

function LoginForm() {
  const account = useAccount();
  const [stage, setStage] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setError(null); setBusy(true);
    try { await account.requestOtp(phone); setStage('otp'); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not send code.'); }
    finally { setBusy(false); }
  }

  async function verify() {
    setError(null); setBusy(true);
    try { await account.verifyOtp(phone, code); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Invalid code.'); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <p className="account-login__lede">
        {stage === 'phone' ? 'Sign in to see past orders and save addresses.' : `We sent a code to ${phone}.`}
      </p>
      {error && <div className="notice notice--error">{error}</div>}
      {stage === 'phone' ? (
        <>
          <label className="field"><span>Mobile number</span>
            <input inputMode="numeric" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit number" autoFocus />
          </label>
          <button className="btn btn--block" disabled={phone.length !== 10 || busy} onClick={sendCode}>{busy ? 'Sending…' : 'Send code'}</button>
        </>
      ) : (
        <>
          <label className="field"><span>6-digit code</span>
            <input inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" autoFocus />
          </label>
          <button className="btn btn--block" disabled={code.length !== 6 || busy} onClick={verify}>{busy ? 'Verifying…' : 'Verify & sign in'}</button>
          <button className="back-link" onClick={() => setStage('phone')}>← Different number</button>
        </>
      )}
    </div>
  );
}

function LoggedIn({ onClose }: { onClose: () => void }) {
  const account = useAccount();
  const [tab, setTab] = useState<'orders' | 'addresses'>('orders');

  useEffect(() => {
    if (tab === 'orders' && !account.ordersLoaded) account.loadOrders().catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div>
      <div className="account-profile">
        <p className="account-profile__name">{account.customer?.name || 'Your account'}</p>
        <p className="account-profile__phone">{account.customer?.phone}</p>
      </div>
      <div className="account-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'orders'} onClick={() => setTab('orders')}>Orders</button>
        <button role="tab" aria-selected={tab === 'addresses'} onClick={() => setTab('addresses')}>Addresses</button>
      </div>
      {tab === 'orders' ? (
        <div>
          {!account.ordersLoaded ? <p className="account-empty">Loading orders…</p>
            : account.orders.length === 0 ? <p className="account-empty">No orders yet.</p>
            : (
              <ul className="account-orders">
                {account.orders.map(o => (
                  <li key={o.id} className="account-order">
                    <div className="account-order__thumb"><span aria-hidden="true">🛍️</span></div>
                    <div className="account-order__info" onClick={onClose}>
                      <p className="account-order__name">#{o.orderNumber}</p>
                      <p className="account-order__meta">{STATUS_LABEL[o.status?.toLowerCase()] ?? o.status}</p>
                    </div>
                    <div className="account-order__end">
                      <span className="account-order__total">₹{o.total}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </div>
      ) : (
        <p className="account-empty">Address management coming soon.</p>
      )}
      <button className="back-link" onClick={account.logout}>Log out</button>
    </div>
  );
}
