import { useEffect, useRef, useState } from 'react';
import { type StorefrontBootstrap, type ProductSummary } from '../types';
import { api } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { Masthead } from '../components/Masthead';
import { CartBar } from '../components/CartBar';
import { Sheet } from '../components/Sheet';
import { AccountPanel } from '../components/AccountPanel';
import { useAccount } from '../state/useAccount';

function useDebounced<T>(v: T, ms: number): T {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

export function Home({ boot, base }: { boot: StorefrontBootstrap; base: string }) {
  const [catId, setCatId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const dq = useDebounced(query, 250);
  const account = useAccount();

  // The full catalogue, paginated — a store can easily have hundreds of products, so
  // "browse everything" needs to page through them the same way search/category does,
  // not just show a fixed handful with no way to see the rest.
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // A changed filter (category/search) starts over from page 1.
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null); setProducts([]); setPage(1); setTotal(0);
    api.products({ categoryId: catId ?? undefined, q: dq || undefined, page: 1 })
      .then(r => { if (!cancelled) { setProducts(r.items); setTotal(r.total); } })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [catId, dq]);

  const hasMore = products.length < total;

  // Infinite scroll — fetch the next page once the sentinel below the grid scrolls into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || loading || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting || fetchingRef.current) return;
      fetchingRef.current = true;
      setLoadingMore(true);
      const nextPage = page + 1;
      api.products({ categoryId: catId ?? undefined, q: dq || undefined, page: nextPage })
        .then(r => { setProducts(prev => [...prev, ...r.items]); setTotal(r.total); setPage(nextPage); })
        .catch(() => undefined)
        .finally(() => { fetchingRef.current = false; setLoadingMore(false); });
    }, { rootMargin: '600px' }); // start loading well before the sentinel is actually on screen

    observer.observe(el);
    return () => observer.disconnect();
  }, [page, catId, dq, loading, hasMore]);

  const hasSearch = !boot.features.length || boot.features.includes('SEARCH');
  const hasCats   = !boot.features.length || boot.features.includes('CATEGORIES');

  const heading = query ? `Results for "${query}"`
    : catId ? boot.categories.find(c => c.id === catId)?.name ?? 'Products'
    : 'Everything in store';

  return (
    <>
      <Masthead store={boot.store} base={base} />

      <div className="home-sticky">
        {hasSearch && (
          <div className="search">
            <span aria-hidden="true">🔍</span>
            <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${boot.store.storeName}`} aria-label="Search products" />
            <button className="masthead__profile" onClick={() => setAccountOpen(true)} aria-label={account.customer ? 'Account' : 'Sign in'}>
              {account.customer ? (account.customer.name?.[0]?.toUpperCase() ?? '👤') : '👤'}
            </button>
          </div>
        )}

        {hasCats && boot.categories.length > 0 && (
          <nav className="rail" aria-label="Categories">
            <button className="chip" aria-pressed={catId === null} onClick={() => setCatId(null)}>All</button>
            {boot.categories.map(c => (
              <button key={c.id} className="chip chip--category" aria-pressed={catId === c.id} onClick={() => setCatId(c.id === catId ? null : c.id)}>
                <span className="chip__icon" aria-hidden="true">
                  {c.imageUrl ? <img src={c.imageUrl} alt="" loading="lazy" /> : '🛒'}
                </span>
                {c.name}
              </button>
            ))}
          </nav>
        )}
      </div>

      <h2 className="section-heading">{heading}</h2>

      {error && <div className="empty"><h2>Could not load products</h2><p>{error}</p></div>}

      {!error && loading && (
        <div className="grid">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="skeleton" />)}</div>
      )}

      {!error && !loading && products.length === 0 && (
        <div className="empty">
          <h2>Nothing here yet</h2>
          <p>{query ? 'Try a shorter word.' : 'This category has no products.'}</p>
        </div>
      )}

      {!error && products.length > 0 && (
        <>
          <div className="grid">
            {products.map(p => <ProductCard key={p.id} product={p} base={base} />)}
          </div>
          {hasMore && (
            <div ref={sentinelRef} style={{ textAlign: 'center', padding: '20px 0', color: 'var(--vs-text-muted)', fontSize: 13 }}>
              {loadingMore ? 'Loading more…' : ''}
            </div>
          )}
        </>
      )}

      <CartBar minOrderPaise={boot.store.minOrderPaise} base={base} />

      <Sheet open={accountOpen} onClose={() => setAccountOpen(false)} labelledBy="account-panel-title">
        <AccountPanel onClose={() => setAccountOpen(false)} base={base} />
      </Sheet>
    </>
  );
}
