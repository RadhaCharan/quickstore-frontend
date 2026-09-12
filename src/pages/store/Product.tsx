import './store.css';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '../../services/api';
import { useCartStore } from '../../store/cartStore';
import { useState } from 'react';

export default function StoreProduct() {
  const { slug, productId } = useParams<{ slug: string; productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, updateQty, items } = useCartStore();
  const [imgIdx, setImgIdx] = useState(0);

  // If opened as a modal (background location), close goes back
  const background = (location.state as any)?.background;

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug, productId],
    queryFn: () => tenantApi(slug!).get(`/storefront/${slug}/products/${productId}`).then(r => r.data),
    enabled: !!productId,
  });

  const qty = items.find(i => i.productId === productId)?.quantity ?? 0;
  const pct = product?.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : null;

  const close = () => background ? navigate(-1) : navigate(`/store/${slug}`);

  if (isLoading) return (
    <div className="pd">
      <div className="pd__skeleton" />
    </div>
  );
  if (!product) return null;

  return (
    <div className="pd">
      {/* Close button */}
      <button className="sheet__close pd__close" onClick={close} aria-label="Close">✕</button>

      {/* Image carousel */}
      {product.images?.length ? (
        <div className="carousel">
          <div className="carousel__track">
            {product.images.map((src: string, i: number) => (
              <div key={i} className="carousel__slide">
                <img src={src} alt={product.name} loading={i === 0 ? 'eager' : 'lazy'} />
              </div>
            ))}
          </div>
          {product.images.length > 1 && (
            <div className="carousel__dots">
              {product.images.map((_: string, i: number) => (
                <button key={i} className="carousel__dot" aria-selected={i === imgIdx} onClick={() => setImgIdx(i)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="carousel carousel--empty"><span>🛍️</span></div>
      )}

      <div className="pd__body">
        {pct && <span className="badge-off">{pct}% off</span>}
        <h1 className="pd__name">{product.name}</h1>
        {product.unit && <p className="card__unit">{product.unit}</p>}

        <p className="pd__price price">
          ₹{product.price}
          {product.mrp && product.mrp > product.price && (
            <span className="price__mrp">₹{product.mrp}</span>
          )}
        </p>

        <div className="pd__add">
          {!product.inStock || product.stock === 0 ? (
            <button className="btn btn--block" disabled>Out of stock</button>
          ) : qty === 0 ? (
            <button className="btn btn--block" onClick={() => addItem({ productId: product.id, name: product.name, price: product.price, quantity: 1, imageUrl: product.images?.[0], unit: product.unit })}>
              Add to Cart
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="stepper">
                <button onClick={() => updateQty(product.id, qty - 1)}>−</button>
                <span>{qty}</span>
                <button onClick={() => updateQty(product.id, qty + 1)}>+</button>
              </div>
              <button className="btn" style={{ flex: 1 }} onClick={() => navigate(`/store/${slug}/checkout`)}>
                Go to Cart →
              </button>
            </div>
          )}
        </div>

        {product.description && (
          <div className="pd__section">
            <h2>Description</h2>
            <p className="pd__description">{product.description}</p>
          </div>
        )}

        <div className="pd__section">
          <p style={{ fontSize: 13, color: 'var(--vs-text-muted)' }}>
            {product.stock > 0
              ? `✓ In stock · ${product.stock} units available`
              : '✗ Out of stock'}
          </p>
        </div>
      </div>
    </div>
  );
}
