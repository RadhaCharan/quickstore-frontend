import { useEffect, useMemo, useState } from 'react';
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
  const [products, setProducts] = useState<ProductSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const dq = useDebounced(query, 250);
  const account = useAccount();

  useEffect(() => {
    let cancelled = false;
    setProducts(null); setError(null);
    api.products({ categoryId: catId ?? undefined, q: dq || undefined })
      .then(r => { if (!cancelled) setProducts(r.items); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [catId, dq]);

  const hasSearch = !boot.features.length || boot.features.includes('SEARCH');
  const hasCats   = !boot.features.length || boot.features.includes('CATEGORIES');

  const heading = query ? `Results for "${query}"`
    : catId ? boot.categories.find(c => c.id === catId)?.name ?? 'Products'
    : 'Everything in store';

  // Use featured products when no filter active
  const displayProducts = (catId || query) ? products : (products ?? boot.featuredProducts);
  const loading = (catId || query) ? products === null : false;

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
              <button key={c.id} className="chip" aria-pressed={catId === c.id} onClick={() => setCatId(c.id === catId ? null : c.id)}>
                {c.name}
                {c.productCount > 0 && <span className="chip__count">{c.productCount}</span>}
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

      {!error && !loading && displayProducts?.length === 0 && (
        <div className="empty">
          <h2>Nothing here yet</h2>
          <p>{query ? 'Try a shorter word.' : 'This category has no products.'}</p>
        </div>
      )}

      {!error && displayProducts && displayProducts.length > 0 && (
        <div className="grid">
          {displayProducts.map(p => <ProductCard key={p.id} product={p} base={base} />)}
        </div>
      )}

      <CartBar minOrderPaise={boot.store.minOrderPaise} base={base} />

      <Sheet open={accountOpen} onClose={() => setAccountOpen(false)} labelledBy="account-panel-title">
        <AccountPanel onClose={() => setAccountOpen(false)} />
      </Sheet>
    </>
  );
}
