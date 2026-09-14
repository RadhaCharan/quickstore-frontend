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
          {/* WhatsApp share */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`🛍️ Check out *${product.name}* at *${boot.store.storeName}*!\n💰 Only ${formatPaise(product.pricePaise)}\n\n👉 ${window.location.href}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, color: '#25D366', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Share on WhatsApp
          </a>

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
