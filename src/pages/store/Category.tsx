import './store.css';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '../../services/api';
import { useCartStore } from '../../store/cartStore';

export default function StoreCategory() {
  const { slug, catSlug } = useParams<{ slug: string; catSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, updateQty, items } = useCartStore();

  const { data = [], isLoading } = useQuery({
    queryKey: ['cat-products', slug, catSlug],
    queryFn: () =>
      tenantApi(slug!).get(`/storefront/${slug}/products`, { params: { category: catSlug, limit: 60 } })
        .then(r => { const d = r.data; return Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : []; }),
    enabled: !!slug && !!catSlug,
  });

  const catName = catSlug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <>
      <header className="masthead">
        <div className="masthead__inner">
          <button className="back-link" onClick={() => navigate(`/store/${slug}`)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--vs-text-muted)' }}>
            ← Back
          </button>
          <h1 className="masthead__name">{catName}</h1>
        </div>
      </header>

      {isLoading ? (
        <div className="grid">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="empty">
          <h2>Nothing here yet</h2>
          <p>This category has no products right now.</p>
        </div>
      ) : (
        <div className="grid">
          {data.map((p: any) => {
            const qty = items.find(i => i.productId === p.id)?.quantity ?? 0;
            const pct = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : null;
            return (
              <article key={p.id} className="card">
                {pct && <span className="badge-off">{pct}% off</span>}
                <Link to={`/store/${slug}/product/${p.id}`} state={{ background: location }} className="card__link">
                  <div className="card__media">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" /> : <span>🛍️</span>}
                  </div>
                  <h3 className="card__name">{p.name}</h3>
                  {p.unit && <p className="card__unit">{p.unit}</p>}
                </Link>
                <div className="card__footer">
                  <p className="price">₹{p.price}{p.mrp > p.price && <span className="price__mrp">₹{p.mrp}</span>}</p>
                  {p.stock === 0 ? (
                    <button className="add" disabled>Sold out</button>
                  ) : qty === 0 ? (
                    <button className="add" onClick={() => addItem({ productId: p.id, name: p.name, price: p.price, quantity: 1, imageUrl: p.images?.[0], unit: p.unit })}>Add</button>
                  ) : (
                    <div className="stepper">
                      <button onClick={() => updateQty(p.id, qty - 1)}>−</button>
                      <span>{qty}</span>
                      <button onClick={() => updateQty(p.id, qty + 1)}>+</button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
