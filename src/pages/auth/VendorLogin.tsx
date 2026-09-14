import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useVendorStore } from '../../store/vendorStore';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export default function VendorLogin() {
  const [mode, setMode]         = useState<'password' | 'otp'>('password');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone]       = useState('');
  const [otp, setOtp]           = useState('');
  const [otpSent, setOtpSent]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const { setAuth, setTenantSlug } = useAuthStore();
  const { setVendorConfig } = useVendorStore();
  const navigate = useNavigate();

  /** After successful login — fetch tenant info and navigate */
  const afterLogin = async (accessToken: string, refreshToken: string, user: any) => {
    setAuth(accessToken, refreshToken, user.role, user.email || '', user.tenantId);
    const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };
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
    // Navigate based on per-tenant onboarding status stored in onboardedTenants:
    //  - true  → vendor completed onboarding (clicked "Go to Dashboard") → Dashboard
    //  - false/undefined → vendor left midway or first time → Onboarding
    navigate(useAuthStore.getState().onboarded ? '/vendor/dashboard' : '/vendor/onboarding');
  };

  // ── Email + password login ────────────────────────────────────────────────
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/vendor/login', { email, password });
      await afterLogin(data.accessToken, data.refreshToken, data.user);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // ── Phone OTP login ───────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    try {
      await api.post('/auth/vendor/otp/send', { phone: phone.trim() });
      setOtpSent(true);
      toast.success('OTP sent to your phone!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/vendor/otp/verify', { phone: phone.trim(), otp });
      await afterLogin(data.accessToken, data.refreshToken, data.user);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
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

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: 20 }}>
          {(['password', 'otp'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#16a34a' : '#6b7280', boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
              {m === 'password' ? '📧 Email & Password' : '📱 Phone OTP'}
            </button>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '32px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

          {/* ── Email + password ── */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="vendor@example.com"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#16a34a'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#16a34a'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <button type="submit" disabled={loading}
                style={{ width: '100%', background: loading ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}

          {/* ── Phone OTP ── */}
          {mode === 'otp' && (
            <form onSubmit={otpSent ? handleOtpLogin : handleSendOtp}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Mobile Number (registered at signup)
                </label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+91 98765 43210"
                  disabled={otpSent}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', background: otpSent ? '#f9fafb' : '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#16a34a'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              {otpSent && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Enter OTP</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code" autoFocus
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 10, padding: '10px 14px', fontSize: 22, textAlign: 'center', letterSpacing: 8, color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#16a34a'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }}
                    style={{ marginTop: 6, background: 'none', border: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer' }}>
                    ← Change number
                  </button>
                </div>
              )}
              <button type="submit" disabled={loading || (otpSent && otp.length !== 6)}
                style={{ width: '100%', background: (loading || (otpSent && otp.length !== 6)) ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {loading ? (otpSent ? 'Verifying…' : 'Sending…') : (otpSent ? 'Verify & Sign In' : 'Send OTP')}
              </button>
            </form>
          )}

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
