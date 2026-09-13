import { Link, useLocation } from 'react-router-dom';
import { formatPaise, percentOff, type ProductSummary } from '../types';
import { useCart } from '../state/cart';

export function ProductCard({ product, base }: { product: ProductSummary; base: string }) {
  const cart = useCart();
  const location = useLocation();
  const qty = cart.qtyOf(product.id);
  const off = percentOff(product.mrpPaise ?? 0, product.pricePaise);
  const atLimit = product.stockQty !== null && qty >= product.stockQty;

  return (
    <article className="card" data-soldout={!product.inStock || undefined}>
      {off !== null && product.inStock && <span className="badge-off">{off}% off</span>}

      <Link to={`${base}/product/${product.id}`} state={{ background: location }} className="card__link">
        <div className="card__media">
          {product.images[0]
            ? <img src={product.images[0]} alt="" loading="lazy" />
            : <span aria-hidden="true">🛍️</span>}
          {!product.inStock && <span className="card__soldout-tag">Sold out</span>}
        </div>
        <h3 className="card__name">{product.name}</h3>
        {product.unit && <p className="card__unit">{product.unit}</p>}
        {product.description && <p className="card__desc">{product.description}</p>}
      </Link>

      <div className="card__footer">
        <p className="price">
          {formatPaise(product.pricePaise)}
          {product.mrpPaise && product.mrpPaise > product.pricePaise && (
            <span className="price__mrp">{formatPaise(product.mrpPaise)}</span>
          )}
        </p>
        {!product.inStock ? (
          <button className="add" disabled>Sold out</button>
        ) : qty === 0 ? (
          <button className="add" onClick={() => cart.add(product)}>Add</button>
        ) : (
          <div className="stepper">
            <button onClick={() => cart.setQty(product.id, qty - 1)} aria-label={`Remove ${product.name}`}>−</button>
            <span aria-live="polite">{qty}</span>
            <button onClick={() => cart.setQty(product.id, qty + 1)} disabled={atLimit} aria-label={`Add ${product.name}`}>+</button>
          </div>
        )}
      </div>
    </article>
  );
}
