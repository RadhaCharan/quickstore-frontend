import '../store.css';
import { useEffect, useState } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { api, setSlug } from './api/client';
import type { StorefrontBootstrap } from './types';
import { CartProvider } from './state/cart';
import { AccountProvider } from './state/account';
import { ThemeProvider } from './theme/ThemeProvider';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { Checkout } from './pages/Checkout';
import { TrackOrder } from './pages/TrackOrder';

export default function StoreRoot() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [boot, setBoot] = useState<StorefrontBootstrap | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Base path for navigation links inside the store
  const base = `/store/${slug}`;

  useEffect(() => {
    if (!slug) return;
    setSlug(slug);
    setBoot(null);
    setError(null);
    api.bootstrap()
      .then(setBoot)
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (!boot && !error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0E1116' }}>
        <div className="grid" style={{ paddingTop: 80 }}>
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className="skeleton" />)}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !boot) {
    return (
      <div className="empty" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Store not found</h2>
        <p>{error || 'This store does not exist or is inactive.'}</p>
      </div>
    );
  }

  // ── App shell ─────────────────────────────────────────────────────────────
  return (
    <CartProvider slug={slug}>
      <AccountProvider slug={slug}>
        <ThemeProvider themeKey={boot.theme.key} primaryColor={boot.theme.primaryColor} />

        <Routes>
          <Route index                element={<Home         boot={boot} base={base} />} />
          <Route path="product/:id"   element={<ProductDetail boot={boot} base={base} />} />
          <Route path="checkout"      element={<Checkout     boot={boot} base={base} />} />
          <Route path="order/:id"     element={<TrackOrder              base={base} />} />
        </Routes>
      </AccountProvider>
    </CartProvider>
  );
}
