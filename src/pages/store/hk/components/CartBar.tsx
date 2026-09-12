import { useEffect, useState } from 'react';
import { formatPaise } from '../types';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../state/cart';

export function CartBar({ minOrderPaise, base }: { minOrderPaise: number; base: string }) {
  const cart = useCart();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(false);
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [expanded]);

  useEffect(() => { if (cart.count === 0) setExpanded(false); }, [cart.count]);

  if (cart.count === 0) return null;

  const short = minOrderPaise - cart.subtotalPaise;
  const below = short > 0;

  return (
    <div className="cartbar">
      {expanded && <div className="cartbar__backdrop" onClick={() => setExpanded(false)} />}
      {expanded && (
        <div className="cartbar__lines" role="dialog" aria-label="Items in your cart">
          {cart.lines.map(line => (
            <div className="cartbar__line" key={line.productId}>
              <div className="cartbar__line-thumb">
                {line.image ? <img src={line.image} alt="" /> : <span aria-hidden="true">🛍️</span>}
              </div>
              <div className="cartbar__line-info">
                <p className="cartbar__line-name">{line.name}</p>
                {line.unit && <p className="card__unit">{line.unit}</p>}
                <p className="price">{formatPaise(line.pricePaise)}</p>
              </div>
              <div className="stepper">
                <button onClick={() => cart.setQty(line.productId, line.qty - 1)} aria-label={`Remove ${line.name}`}>−</button>
                <span aria-live="polite">{line.qty}</span>
                <button onClick={() => cart.setQty(line.productId, line.qty + 1)} aria-label={`Add ${line.name}`}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="cartbar__inner">
        <button className="cartbar__chevron" aria-expanded={expanded} aria-label={expanded ? 'Hide' : 'Show'} onClick={() => setExpanded(o => !o)}>▲</button>
        <p className="cartbar__summary">
          <strong>{cart.count} {cart.count === 1 ? 'item' : 'items'} · {formatPaise(cart.subtotalPaise)}</strong>
          <span>{below ? `Add ${formatPaise(short)} more` : 'Delivery shown at checkout'}</span>
        </p>
        <button className="btn" disabled={below} onClick={() => { setExpanded(false); navigate(`${base}/checkout`); }}>
          Checkout
        </button>
      </div>
    </div>
  );
}
