import '../store.css';
import { useEffect, useState } from 'react';
import { Routes, Route, useParams, useLocation, type Location } from 'react-router-dom';
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
  const location = useLocation();
  // A product card stashes the page it was clicked from as `state.background` (see
  // ProductCard) — when present, the product detail opens as an overlay on top of that
  // page instead of replacing it, so closing it doesn't reset scroll position/filters.
  const backgroundLocation = (location.state as { background?: Location } | null)?.background;
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

        {/* Rendered against the *background* location when one is stashed, so a product
            opened as an overlay doesn't replace whatever page it was opened from. */}
        <Routes location={backgroundLocation ?? location}>
          <Route index                element={<Home         boot={boot} base={base} />} />
          <Route path="product/:id"   element={<ProductDetail boot={boot} base={base} />} />
          <Route path="checkout"      element={<Checkout     boot={boot} base={base} />} />
          <Route path="order/:id"     element={<TrackOrder              base={base} />} />
        </Routes>

        {/* The overlay itself — always matched against the *real* current location, so it's
            active exactly when the URL is a product page, background or not. */}
        {backgroundLocation && (
          <Routes>
            <Route path="product/:id" element={<ProductDetail boot={boot} base={base} isModal />} />
          </Routes>
        )}
      </AccountProvider>
    </CartProvider>
  );
}
