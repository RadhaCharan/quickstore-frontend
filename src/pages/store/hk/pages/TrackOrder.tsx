import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { formatPaise } from '../types';
import { api } from '../api/client';
import { useAccount } from '../state/useAccount';

const STAGES = [
  { status: 'placed',            label: 'Order placed' },
  { status: 'confirmed',         label: 'Shop confirmed it' },
  { status: 'packed',            label: 'Packed and ready' },
  { status: 'out_for_delivery',  label: 'Out for delivery' },
  { status: 'delivered',         label: 'Delivered' },
];

export function TrackOrder({ base }: { base: string }) {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const account = useAccount();
  const navigate = useNavigate();
  const phone = searchParams.get('phone') ?? account.customer?.phone ?? '';
  const [data, setData] = useState<Awaited<ReturnType<typeof api.track>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!phone) return;
    let cancelled = false;
    const load = () =>
      api.track(id, phone)
        .then(r => { if (!cancelled) setData(r); })
        .catch((e: Error) => { if (!cancelled) setError(e.message); });
    load();
    const timer = setInterval(load, 20_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [id, phone]);

  const backBtn = <button className="back-link" onClick={() => navigate(base)}>← Back to shop</button>;

  if (error) return <div className="page">{backBtn}<div className="empty"><h2>Order not found</h2><p>{error}</p></div></div>;
  if (!phone) return <div className="page">{backBtn}<div className="empty"><h2>Sign in to see this order</h2></div></div>;
  if (!data) return <div className="page">{backBtn}<div className="empty"><p>Loading your order…</p></div></div>;

  const reached = new Map(data.timeline.map(e => [e.to_status, new Date(e.created_at)]));
  const cancelled = data.order.status === 'cancelled';

  return (
    <div className="page">
      {backBtn}
      <h1>{data.order.code}</h1>
      <p className="page__lede">
        {formatPaise(data.order.total_paise)} · {data.order.payment_status === 'paid' ? 'Paid' : 'Pay on delivery'}
      </p>

      <div className="summary">
        {data.items.map((item, i) => (
          <div key={i} className="summary__row">
            <span className="summary__item">
              <span className="summary__thumb">
                {item.image ? <img src={item.image} alt="" /> : <span aria-hidden="true">🛍️</span>}
              </span>
              <span>
                {item.name_snapshot}{item.unit_snapshot ? ` (${item.unit_snapshot})` : ''} × {item.qty}
                <br /><span className="summary__meta">{formatPaise(item.price_paise)} each</span>
              </span>
            </span>
            <span>{formatPaise(item.line_total_paise)}</span>
          </div>
        ))}
        <div className="summary__row summary__row--total">
          <span>Total</span>
          <span>{formatPaise(data.order.total_paise)}</span>
        </div>
      </div>

      {cancelled ? (
        <div className="notice notice--error">This order was cancelled.</div>
      ) : (
        <ol className="timeline">
          {STAGES.map(stage => {
            const at = reached.get(stage.status);
            return (
              <li key={stage.status} data-done={Boolean(at)}>
                <span className="timeline__dot" aria-hidden="true">{at ? '✓' : ''}</span>
                <div>
                  <p className="timeline__label">{stage.label}</p>
                  {at && <p className="timeline__time">{at.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' })}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
