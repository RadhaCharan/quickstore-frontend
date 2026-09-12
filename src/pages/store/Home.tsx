import './store.css';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '../../services/api';
import { useCartStore } from '../../store/cartStore';
import { ThemeProvider } from './ThemeProvider';

// ── Types ─────────────────────────────────────────────────────────────────────
interface BootstrapData {
  store: { id: string; slug: string; storeName: string; tagline: string; logoUrl: string | null; bannerUrl: string | null; contactPhone: string; category: string };
  theme: { key: string; primaryColor: string };
  delivery: { fee: number; minOrderAmount: number; freeAbove: number | null };
  features: string[];
  categories: { id: string; name: string; slug: string; imageUrl: string | null; productCount: number }[];
  featuredProducts: Product[];
}
interface Product {
  id: string; name: string; description: string;
  price: number; mrp: number | null; stock: number; unit: string;
  images: string[]; inStock: boolean; discountPct: number | null; categoryId: string;
}

// ── Debounce ──────────────────────────────────────────────────────────────────
function useDebounced<T>(value: T, ms: number): T {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return d;
}

// ── CartBar ───────────────────────────────────────────────────────────────────
function CartBar({ slug }: { slug: string }) {
  const { items, itemCount, total, updateQty } = useCartStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const n = itemCount();
  if (n === 0) return null;

  const formatRs = (v: number) => `₹${v % 1 === 0 ? v : v.toFixed(2)}`;

  return (
    <div className="cartbar">
      {open && <div className="cartbar__backdrop" onClick={() => setOpen(false)} />}
      {open && (
        <div className="cartbar__lines">
          {items.map(item => (
            <div key={item.productId} className="cartbar__line">
              <div className="cartbar__line-thumb">
                {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : '📦'}
              </div>
              <div className="cartbar__line-info">
                <div className="cartbar__line-name">{item.name}</div>
                <div className="stepper" style={{ marginTop: 4 }}>
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.quantity + 1)}>+</button>
                </div>
              </div>
              <div style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 13 }}>
                {formatRs(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="cartbar__inner">
        <div className="cartbar__summary">
          <strong>{n} item{n > 1 ? 's' : ''}</strong>
          <span>{formatRs(total())}</span>
        </div>
        <button className="cartbar__chevron" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          {open ? '▼' : '▲'}
        </button>
        <button className="btn" onClick={() => navigate(`/store/${slug}/checkout`)}>
          Checkout →
        </button>
      </div>
    </div>
  );
}

// ── ProductCard ───────────────────────────────────────────────────────────────
function ProductCard({ product, slug }: { product: Product; slug: string }) {
  const { addItem, updateQty, items } = useCartStore();
  const location = useLocation();
  const qty = items.find(i => i.productId === product.id)?.quantity ?? 0;

  return (
    <article className="card">
      {product.discountPct && <span className="badge-off">{product.discountPct}% off</span>}

      <Link to={`/store/${slug}/product/${product.id}`} state={{ background: location }} className="card__link">
        <div className="card__media">
          {product.images?.[0]
            ? <img src={product.images[0]} alt={product.name} loading="lazy" />
            : <span aria-hidden="true">🛍️</span>}
        </div>
        <h3 className="card__name">{product.name}</h3>
        {product.unit && <p className="card__unit">{product.unit}</p>}
        {product.description && <p className="card__desc">{product.description}</p>}
      </Link>

      <div className="card__footer">
        <p className="price">
          ₹{product.price}
          {product.mrp && product.mrp > product.price && (
            <span className="price__mrp">₹{product.mrp}</span>
          )}
        </p>
        {!product.inStock ? (
          <button className="add" disabled>Sold out</button>
        ) : qty === 0 ? (
          <button className="add" onClick={() => addItem({ productId: product.id, name: product.name, price: product.price, quantity: 1, imageUrl: product.images?.[0], unit: product.unit })}>
            Add
          </button>
        ) : (
          <div className="stepper">
            <button onClick={() => updateQty(product.id, qty - 1)}>−</button>
            <span>{qty}</span>
            <button onClick={() => updateQty(product.id, qty + 1)}>+</button>
          </div>
        )}
      </div>
    </article>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StoreHome() {
  const { slug } = useParams<{ slug: string }>();
  const [catId, setCatId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const debouncedQ = useDebounced(query, 250);
  const mastheadRef = useRef<HTMLElement>(null);

  const { data: boot, isLoading, error } = useQuery<BootstrapData>({
    queryKey: ['bootstrap', slug],
    queryFn: () => tenantApi(slug!).get(`/storefront/${slug}/bootstrap`).then(r => r.data),
    enabled: !!slug,
    staleTime: 60_000,
  });

  // Fetch products when search/category changes
  const { data: searchData } = useQuery({
    queryKey: ['store-products', slug, catId, debouncedQ],
    queryFn: () => tenantApi(slug!).get(`/storefront/${slug}/products`, {
      params: { ...(catId ? { categoryId: catId } : {}), ...(debouncedQ ? { search: debouncedQ } : {}), limit: 40 }
    }).then(r => { const d = r.data; return Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : []; }),
    enabled: !!slug && !!(catId || debouncedQ),
    staleTime: 30_000,
  });

  // Measure masthead height for sticky search
  useEffect(() => {
    if (!mastheadRef.current) return;
    const h = mastheadRef.current.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--vs-masthead-h', `${h}px`);
  }, [boot]);

  const products: Product[] = catId || debouncedQ
    ? (searchData as Product[] || [])
    : (boot?.featuredProducts || []);

  const heading = debouncedQ
    ? `Results for "${debouncedQ}"`
    : catId
      ? boot?.categories.find(c => c.id === catId)?.name || 'Products'
      : 'Everything in store';

  const hasSearch     = !boot || boot.features.includes('SEARCH');
  const hasCategories = !boot || boot.features.includes('CATEGORIES');

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0E1116' }}>
      <div className="grid" style={{ maxWidth: 390, width: '100%', padding: '0 16px' }}>
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" />)}
      </div>
    </div>
  );

  if (error || !boot) return (
    <div className="empty" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <h2>Store not found</h2>
      <p>This store doesn't exist or is currently inactive.</p>
    </div>
  );

  return (
    <>
      <ThemeProvider themeKey={boot.theme.key} primaryColor={boot.theme.primaryColor} />

      {/* ── Masthead ── */}
      <header className="masthead masthead--sticky" ref={mastheadRef}>
        <div className="masthead__inner">
          <div className="masthead__identity">
            {boot.store.logoUrl
              ? <img src={boot.store.logoUrl} alt="" className="masthead__logo" />
              : <div className="masthead__logo" style={{ display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16, color: 'var(--vs-accent)' }}>
                  {boot.store.storeName[0]}
                </div>}
            <div>
              <div className="masthead__name">{boot.store.storeName}</div>
              {boot.store.tagline && <div className="masthead__meta">{boot.store.tagline}</div>}
            </div>
          </div>
          <div className="promise">
            <span>⚡</span> 30 min delivery
          </div>
        </div>
      </header>

      {/* ── Sticky search + categories ── */}
      <div className="home-sticky">
        {hasSearch && (
          <div className="search">
            <span aria-hidden="true">🔍</span>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${boot.store.storeName}`}
              aria-label="Search products"
            />
          </div>
        )}

        {hasCategories && boot.categories.length > 0 && (
          <nav className="rail" aria-label="Categories">
            <button className="chip" aria-pressed={catId === null} onClick={() => setCatId(null)}>
              All
            </button>
            {boot.categories.map(cat => (
              <button key={cat.id} className="chip" aria-pressed={catId === cat.id} onClick={() => setCatId(cat.id === catId ? null : cat.id)}>
                {cat.name}
                {cat.productCount > 0 && <span className="chip__count">{cat.productCount}</span>}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* ── Delivery info strip ── */}
      {boot.delivery.fee > 0 || boot.delivery.freeAbove ? (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 16px 0', scrollbarWidth: 'none' }}>
          {boot.delivery.fee > 0 && (
            <span className="chip" style={{ fontSize: 11, padding: '4px 10px', cursor: 'default' }}>
              🛵 ₹{boot.delivery.fee} delivery
            </span>
          )}
          {boot.delivery.minOrderAmount > 0 && (
            <span className="chip" style={{ fontSize: 11, padding: '4px 10px', cursor: 'default' }}>
              Min ₹{boot.delivery.minOrderAmount}
            </span>
          )}
          {boot.delivery.freeAbove && (
            <span className="chip" style={{ fontSize: 11, padding: '4px 10px', cursor: 'default', background: 'var(--vs-accent)', color: 'var(--vs-accent-text)', border: 'none' }}>
              🎁 Free above ₹{boot.delivery.freeAbove}
            </span>
          )}
        </div>
      ) : null}

      {/* ── Product grid ── */}
      <h2 className="section-heading" style={{ marginTop: 16 }}>{heading}</h2>

      {products.length === 0 && (catId || debouncedQ) ? (
        <div className="empty">
          <h2>Nothing here yet</h2>
          <p>{debouncedQ ? 'Try a shorter word or browse categories.' : 'This category has no products right now.'}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty">
          <h2>No products yet</h2>
          <p>Check back soon — the store is being stocked.</p>
        </div>
      ) : (
        <div className="grid">
          {products.map(p => <ProductCard key={p.id} product={p} slug={slug!} />)}
        </div>
      )}

      <CartBar slug={slug!} />
    </>
  );
}
