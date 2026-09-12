import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { StorefrontBootstrap } from '../types';

export function Masthead({ store, base }: { store: StorefrontBootstrap['store']; base: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const set = () => document.documentElement.style.setProperty('--vs-masthead-h', `${el.offsetHeight}px`);
    set();
    const obs = new ResizeObserver(set);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <header ref={ref} className="masthead masthead--sticky">
      <div className="masthead__inner">
        <Link to={base} className="masthead__identity">
          {store.logoUrl
            ? <img className="masthead__logo" src={store.logoUrl} alt="" />
            : <div className="masthead__logo" style={{ display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 17, color: 'var(--vs-accent)' }} aria-hidden="true">{store.storeName[0]}</div>}
          <div>
            <p className="masthead__name">{store.storeName}</p>
            <p className="masthead__meta">{store.tagline || 'Fresh products delivered fast'}</p>
          </div>
        </Link>
        <p className="promise">⚡ 30 min delivery</p>
      </div>
    </header>
  );
}
