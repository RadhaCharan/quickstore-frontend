import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPaise } from '../types';
import { useAccount } from '../state/useAccount';
import { ApiError } from '../api/client';

const STATUS_LABEL: Record<string, string> = {
  placed: 'Placed', confirmed: 'Confirmed', packed: 'Packed',
  out_for_delivery: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};

export function AccountPanel({ onClose, base }: { onClose: () => void; base: string }) {
  const account = useAccount();
  return (
    <div>
      <div className="sheet__header">
        <h2 id="account-panel-title">{account.customer ? 'Your account' : 'Sign in'}</h2>
        <button className="sheet__close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      {account.customer ? <LoggedIn onClose={onClose} base={base} /> : <LoginForm />}
    </div>
  );
}

function LoginForm() {
  const account = useAccount();
  const [stage, setStage] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setError(null); setBusy(true);
    try {
      const r = await account.requestOtp(phone);
      setStage('otp');
      setDevCode(r.devCode ?? null);
      if (r.devCode) setCode(r.devCode);
    }
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
          {devCode && <div className="notice">Dev mode — code: <strong>{devCode}</strong></div>}
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

function LoggedIn({ onClose, base }: { onClose: () => void; base: string }) {
  const account = useAccount();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'orders' | 'addresses'>('orders');

  function openOrder(orderNumber: string) {
    onClose();
    navigate(`${base}/order/${orderNumber}`);
  }

  // Always refetch on opening a tab — not just the first time. Orders/addresses can change
  // server-side behind this panel's back (an order just placed, an address it saved inline),
  // so a one-shot "load once, cache forever" flag would keep showing stale/empty data.
  useEffect(() => {
    if (tab === 'orders') account.loadOrders().catch(() => undefined);
    else account.loadAddresses().catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div>
      <div className="account-profile">
        <NameField />
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
                  <li key={o.id} className="account-order" onClick={() => openOrder(o.orderNumber)} style={{ cursor: 'pointer' }}>
                    <div className="account-order__thumb"><span aria-hidden="true">🛍️</span></div>
                    <div className="account-order__info">
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
        <AddressesTab />
      )}
      <button className="back-link" onClick={account.logout}>Log out</button>
    </div>
  );
}

function NameField() {
  const account = useAccount();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(account.customer?.name || '');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try { await account.updateName(name.trim()); setEditing(false); } finally { setBusy(false); }
  }

  if (editing) {
    return (
      <div className="account-profile__edit">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoFocus
          onKeyDown={e => e.key === 'Enter' && save()} />
        <button className="account-profile__edit-link" disabled={busy} onClick={save}>{busy ? '…' : 'Save'}</button>
        <button className="account-profile__edit-link" onClick={() => setEditing(false)}>Cancel</button>
      </div>
    );
  }

  return (
    <p className="account-profile__name">
      {account.customer?.name || 'Add your name'}{' '}
      <button className="account-profile__edit-link" onClick={() => setEditing(true)}>Edit</button>
    </p>
  );
}

const BLANK_ADDRESS = { label: 'Home', line1: '', line2: '', city: '', pincode: '', isDefault: false };

function AddressesTab() {
  const account = useAccount();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK_ADDRESS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof BLANK_ADDRESS) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function save() {
    setError(null); setBusy(true);
    try {
      await account.addAddress(form);
      setForm(BLANK_ADDRESS);
      setAdding(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save this address.');
    } finally {
      setBusy(false);
    }
  }

  const ready = form.line1.trim().length > 3 && form.city.trim().length > 1;

  return (
    <div>
      {account.addresses.length === 0 && !adding && <p className="account-empty">No saved addresses yet.</p>}

      {account.addresses.length > 0 && (
        <ul className="account-orders">
          {account.addresses.map(a => (
            <li key={a.id} className="account-order">
              <div className="account-order__thumb"><span aria-hidden="true">📍</span></div>
              <div className="account-order__info">
                <p className="account-order__name">{a.label}{a.isDefault ? ' · Default' : ''}</p>
                <p className="account-order__meta">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city} {a.pincode}</p>
              </div>
              <div className="account-order__end">
                <button className="sheet__close" onClick={() => account.removeAddress(a.id).catch(() => undefined)} aria-label={`Remove ${a.label}`}>✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div style={{ marginTop: 12 }}>
          {error && <div className="notice notice--error">{error}</div>}
          <label className="field"><span>Label</span>
            <input value={form.label} onChange={set('label')} placeholder="Home, Work…" />
          </label>
          <label className="field"><span>Address *</span>
            <input value={form.line1} onChange={set('line1')} placeholder="House or flat, street" autoFocus />
          </label>
          <label className="field"><span>Landmark</span>
            <input value={form.line2} onChange={set('line2')} placeholder="Near the temple…" />
          </label>
          <div className="field--pair">
            <label className="field"><span>City *</span><input value={form.city} onChange={set('city')} /></label>
            <label className="field"><span>PIN code</span><input inputMode="numeric" maxLength={6} value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))} /></label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="back-link" onClick={() => { setAdding(false); setError(null); }}>Cancel</button>
            <button className="btn btn--block" disabled={!ready || busy} onClick={save}>{busy ? 'Saving…' : 'Save address'}</button>
          </div>
        </div>
      ) : (
        <button className="btn btn--block" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>+ Add address</button>
      )}
    </div>
  );
}
