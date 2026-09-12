import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useVendorStore } from '../../store/vendorStore';
import {
  LayoutDashboard, Package, ShoppingBag, Truck,
  Tag, Users, Settings, LogOut, Zap, BarChart2, Puzzle, FolderTree,
} from 'lucide-react';

// All possible nav items — each tied to a feature flag (null = always visible)
const ALL_NAV = [
  { to: '/vendor/dashboard',  icon: LayoutDashboard, label: 'Dashboard',     feature: null },
  { to: '/vendor/products',   icon: Package,          label: 'Products',      feature: 'PRODUCTS' },
  { to: '/vendor/categories', icon: FolderTree,       label: 'Categories',    feature: 'CATEGORIES' },
  { to: '/vendor/orders',     icon: ShoppingBag,      label: 'Orders',        feature: 'ORDERS' },
  { to: '/vendor/delivery',   icon: Truck,            label: 'Delivery',      feature: 'DELIVERY_TRACKING' },
  { to: '/vendor/discounts',  icon: Tag,              label: 'Discounts',     feature: 'DISCOUNTS' },
  { to: '/vendor/customers',  icon: Users,            label: 'Customers',     feature: 'CUSTOMER_ACCOUNTS' },
  { to: '/vendor/features',   icon: Puzzle,           label: 'Add Features',  feature: null },
  { to: '/vendor/settings',   icon: Settings,         label: 'Settings',      feature: null },
];

export default function VendorLayout() {
  const { logout, email } = useAuthStore();
  const { clearVendor, storeName, features } = useVendorStore();
  const navigate = useNavigate();

  // Derive directly from features array so Zustand triggers re-render when features change
  const isEnabled = (key: string | null) => key === null || features.length === 0 || features.includes(key);
  const visibleNav    = ALL_NAV.filter(item => isEnabled(item.feature));
  const disabledNav   = ALL_NAV.filter(item => item.feature && !isEnabled(item.feature));

  const initials = email ? email.slice(0, 2).toUpperCase() : 'QS';

  const handleLogout = () => {
    logout();
    clearVendor();
    navigate('/vendor/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 240, background: '#0f172a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        {/* Brand */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: '#16a34a', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {storeName || 'QuickStore'}
            </div>
            <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>Vendor Admin</div>
          </div>
        </div>

        {/* Navigation — only enabled features */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <div style={{ color: '#475569', fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', padding: '0 10px', marginBottom: 8 }}>
            Menu
          </div>

          {visibleNav.map(({ to, icon: Icon, label, feature }) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                  background: isActive ? '#16a34a' : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                  fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: 'pointer',
                }}>
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {/* Feature badge for non-core items */}
                  {feature && (
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: isActive ? 'rgba(255,255,255,0.2)' : '#1e293b', color: isActive ? '#fff' : '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                      ON
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}

          {/* Divider before settings */}
          <div style={{ height: 1, background: '#1e293b', margin: '8px 10px' }} />

          {/* Disabled features — shown greyed out so vendor knows they're locked */}
          {disabledNav.length > 0 && (
            <>
              <div style={{ color: '#334155', fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 10px 4px' }}>
                Not enabled
              </div>
              {disabledNav.map(({ to, icon: Icon, label, feature }) => (
                <div
                  key={to}
                  title={`Enable "${label}" from Settings → Features`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 2, color: '#334155', fontSize: 13, cursor: 'not-allowed', opacity: 0.5 }}
                >
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{label}</span>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#1e293b', color: '#475569', fontWeight: 600, letterSpacing: 0.3 }}>OFF</span>
                </div>
              ))}
            </>
          )}
        </nav>

        {/* Footer — user info + sign out */}
        <div style={{ padding: '12px 8px 16px', borderTop: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: '#1e293b', marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
              <div style={{ color: '#475569', fontSize: 10 }}>Vendor</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8, background: 'transparent', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer' }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
        <Outlet />
      </main>
    </div>
  );
}
