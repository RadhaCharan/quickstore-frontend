import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useVendorStore } from '../../store/vendorStore';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export default function VendorLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { setAuth, setTenantSlug, onboarded } = useAuthStore();
  const { setVendorConfig } = useVendorStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/vendor/login', { email, password });
      setAuth(data.accessToken, data.refreshToken, data.user.role, data.user.email, data.user.tenantId);

      // Must await before navigating — tenantSlug must be set before any API calls on next page
      const authHeader = { headers: { Authorization: `Bearer ${data.accessToken}` } };
      try {
        const [meRes, featRes] = await Promise.all([
          api.get('/tenant/me', authHeader),
          api.get('/tenant/features', authHeader),
        ]);
        const slug = meRes.data?.slug || '';
        if (slug) setTenantSlug(slug);
        const features: string[] = (featRes.data || [])
          .filter((f: any) => f.enabled !== false)
          .map((f: any) => f.feature || f);
        setVendorConfig({ features, storeName: meRes.data?.name || '', slug, plan: meRes.data?.plan || '' });
      } catch {}

      navigate(onboarded ? '/vendor/dashboard' : '/vendor/onboarding');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 16px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: '#16a34a', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Q</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>QuickStore</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>Sign in to your vendor portal</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '32px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="vendor@example.com"
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: loading ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: 0.2 }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 20, marginBottom: 0 }}>
            New vendor?{' '}
            <Link to="/vendor/signup" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>
              Register your store →
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 24 }}>
          Demo: vendor@quickstore.in / Demo@1234
        </p>
      </div>
    </div>
  );
}
