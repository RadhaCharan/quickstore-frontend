import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ProductSummary } from '../types';

export interface CartLine {
  productId: string;
  name: string;
  unit: string | null;
  pricePaise: number;
  qty: number;
  image: string | null;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotalPaise: number;
  qtyOf: (productId: string) => number;
  add: (product: ProductSummary) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(slug: string) { return `qs:cart:${slug}`; }

export function CartProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try { const r = localStorage.getItem(storageKey(slug)); return r ? JSON.parse(r) : []; }
    catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey(slug), JSON.stringify(lines)); } catch {}
  }, [lines, slug]);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines(cur => qty <= 0
      ? cur.filter(l => l.productId !== productId)
      : cur.map(l => l.productId === productId ? { ...l, qty } : l)
    );
  }, []);

  const add = useCallback((product: ProductSummary) => {
    setLines(cur => {
      const ex = cur.find(l => l.productId === product.id);
      if (ex) return cur.map(l => l.productId === product.id ? { ...l, qty: l.qty + 1 } : l);
      return [...cur, { productId: product.id, name: product.name, unit: product.unit, pricePaise: product.pricePaise, qty: 1, image: product.images[0] ?? null }];
    });
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const map = new Map(lines.map(l => [l.productId, l.qty]));
    return {
      lines, count: lines.reduce((s, l) => s + l.qty, 0),
      subtotalPaise: lines.reduce((s, l) => s + l.pricePaise * l.qty, 0),
      qtyOf: (id) => map.get(id) ?? 0, add, setQty,
      clear: () => setLines([]),
    };
  }, [lines, add, setQty]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
