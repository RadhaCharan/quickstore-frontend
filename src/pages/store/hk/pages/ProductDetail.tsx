import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatPaise, percentOff, type ProductDetail as PDType } from '../types';
import { api } from '../api/client';
import { useCart } from '../state/cart';
import { Carousel } from '../components/Carousel';
import { CartBar } from '../components/CartBar';
import { Sheet } from '../components/Sheet';
import type { StorefrontBootstrap } from '../types';

export function ProductDetail({ boot, base, isModal }: { boot: StorefrontBootstrap; base: string; isModal?: boolean }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const [product, setProduct] = useState<PDType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProduct(null); setError(null);
    api.product(id)
      .then(r => { if (!cancelled) setProduct(r); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [id]);

  function close() {
    // Reached via a product-card Link, which stashed the page you came from as
    // `state.background` (see ProductCard) — going back returns to that exact page,
    // still mounted with its scroll position and filters intact, instead of resetting it.
    if (window.history.length > 1) navigate(-1);
    else navigate(base);
  }

  const body = (() => {
    if (error) return (
      <div className="pd">
        <button className="back-link" onClick={close}>← Back</button>
        <div className="empty"><h2>Product not found</h2><p>{error}</p></div>
      </div>
    );

    if (!product) return <div className="pd"><div className="pd__skeleton" /></div>;

    const off = percentOff(product.mrpPaise ?? 0, product.pricePaise);
    const qty = cart.qtyOf(product.id);
    const atLimit = product.stockQty !== null && qty >= product.stockQty;

    return (
      <div className="pd" data-soldout={!product.inStock || undefined}>
        {!isModal && <button className="sheet__close pd__close" onClick={close} aria-label="Close">✕</button>}
        <Carousel images={product.images} alt={product.name} />
        {!product.inStock && <span className="card__soldout-tag pd__soldout-tag">Sold out</span>}
        <div className="pd__body">
          {off !== null && <span className="badge-off">{off}% off</span>}
          <h1 className="pd__name" id="pd-title">{product.name}</h1>
          {product.unit && <p className="card__unit">{product.unit}</p>}
          <p className="price pd__price">
            {formatPaise(product.pricePaise)}
            {product.mrpPaise && product.mrpPaise > product.pricePaise && (
              <span className="price__mrp">{formatPaise(product.mrpPaise)}</span>
            )}
          </p>
          {!product.inStock ? (
            <button className="add pd__add" disabled>Sold out</button>
          ) : qty === 0 ? (
            <button className="add pd__add" onClick={() => cart.add(product)}>Add to cart</button>
          ) : (
            <div className="stepper pd__add">
              <button onClick={() => cart.setQty(product.id, qty - 1)} aria-label={`Remove ${product.name}`}>−</button>
              <span aria-live="polite">{qty}</span>
              <button onClick={() => cart.setQty(product.id, qty + 1)} disabled={atLimit} aria-label={`Add ${product.name}`}>+</button>
            </div>
          )}
          {product.description && (
            <div className="pd__section"><h2>About this product</h2><p className="pd__description">{product.description}</p></div>
          )}
        </div>
      </div>
    );
  })();

  // Opened from a product card: render as an overlay (via Sheet) on top of whatever page
  // you were browsing, which stays mounted underneath — closing it just removes the
  // overlay instead of navigating to a fresh copy of that page at the top of its scroll.
  if (isModal) {
    return (
      <Sheet open onClose={close} labelledBy="pd-title">
        <button className="sheet__close pd__close" onClick={close} aria-label="Close">✕</button>
        {body}
      </Sheet>
    );
  }

  // Reached directly (shared link, refresh) — no page to sit "on top of", so render as a
  // normal full page, cart bar included.
  return (
    <>
      {body}
      <CartBar minOrderPaise={boot.store.minOrderPaise} base={base} />
    </>
  );
}
