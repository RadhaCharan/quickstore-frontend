import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useVendorStore } from './store/vendorStore';

import VendorLogin      from './pages/auth/VendorLogin';
import VendorSignup     from './pages/onboarding/VendorSignup';
import VendorOnboarding from './pages/vendor/Onboarding';
import VendorDashboard  from './pages/vendor/Dashboard';
import VendorProducts   from './pages/vendor/Products';
import VendorCategories from './pages/vendor/Categories';
import VendorOrders     from './pages/vendor/Orders';
import VendorDelivery   from './pages/vendor/Delivery';
import VendorDiscounts  from './pages/vendor/Discounts';
import VendorCustomers  from './pages/vendor/Customers';
import VendorSettings   from './pages/vendor/Settings';
import VendorFeatures   from './pages/vendor/Features';
import VendorLayout     from './components/vendor/VendorLayout';

// HyperKart-integrated customer storefront
import StoreRoot from './pages/store/hk/StoreRoot';

// ── Guards ────────────────────────────────────────────────────────────────────
function VendorGuard({ children }: { children: React.ReactNode }) {
  const { token, role } = useAuthStore();
  if (!token || !['VENDOR_OWNER', 'VENDOR_STAFF', 'SUPER_ADMIN'].includes(role))
    return <Navigate to="/vendor/login" replace />;
  return <>{children}</>;
}

function OnboardedGuard({ children }: { children: React.ReactNode }) {
  const { token, role, onboarded } = useAuthStore();
  if (!token || !['VENDOR_OWNER', 'VENDOR_STAFF', 'SUPER_ADMIN'].includes(role))
    return <Navigate to="/vendor/login" replace />;
  if (!onboarded) return <Navigate to="/vendor/onboarding" replace />;
  return <>{children}</>;
}

function FeatureGuard({ feature, children }: { feature: string; children: React.ReactNode }) {
  const { features } = useVendorStore();
  if (features.length > 0 && !features.includes(feature))
    return <Navigate to="/vendor/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Vendor Auth ── */}
        <Route path="/vendor/login"      element={<VendorLogin />} />
        <Route path="/vendor/signup"     element={<VendorSignup />} />
        <Route path="/vendor/onboarding" element={<VendorGuard><VendorOnboarding /></VendorGuard>} />

        {/* ── Vendor Admin Portal ── */}
        <Route path="/vendor" element={<OnboardedGuard><VendorLayout /></OnboardedGuard>}>
          <Route index          element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="features"  element={<VendorFeatures />} />
          <Route path="settings"  element={<VendorSettings />} />
          <Route path="products"   element={<FeatureGuard feature="PRODUCTS"><VendorProducts /></FeatureGuard>} />
          <Route path="categories" element={<FeatureGuard feature="CATEGORIES"><VendorCategories /></FeatureGuard>} />
          <Route path="orders"    element={<FeatureGuard feature="ORDERS"><VendorOrders /></FeatureGuard>} />
          <Route path="delivery"  element={<FeatureGuard feature="DELIVERY_TRACKING"><VendorDelivery /></FeatureGuard>} />
          <Route path="discounts" element={<FeatureGuard feature="DISCOUNTS"><VendorDiscounts /></FeatureGuard>} />
          <Route path="customers" element={<FeatureGuard feature="CUSTOMER_ACCOUNTS"><VendorCustomers /></FeatureGuard>} />
        </Route>

        {/* ── Customer Store — HyperKart storefront mounted here ── */}
        {/* The /* wildcard lets StoreRoot manage its own sub-routes (product/:id, checkout, order/:id) */}
        <Route path="/store/:slug/*" element={<StoreRoot />} />

        {/* ── Defaults ── */}
        <Route path="/" element={<Navigate to="/vendor/login" replace />} />
        <Route path="*" element={<Navigate to="/vendor/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
