import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';

export default function VendorSignup() {
  const navigate = useNavigate();
  const [step, setStep]       = useState<'form' | 'otp'>('form');
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ storeName: '', phone: '', email: '', password: '' });
  const [otp, setOtp]         = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const previewSlug = form.storeName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 30);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!form.storeName.trim()) err.storeName = 'Store name is required';
    if (!form.phone.trim())     err.phone     = 'Phone number is required';
    if (!form.email.trim())     err.email     = 'Email is required';
    if (!form.password)         err.password  = 'Password is required';
    if (form.password && form.password.length < 8) err.password = 'Minimum 8 characters';
    return err;
  };

  // Step 1: Submit signup form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/tenant/signup', {
        name: form.storeName.trim(),
        ownerName: form.storeName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        category: 'General',
        requestedFeatures: ['PRODUCTS', 'ORDERS', 'SEARCH', 'CATEGORIES'],
      });
      if (data.requiresOtp) {
        setSignupPhone(data.phone || form.phone.trim());
        setStep('otp');
        toast.success('OTP sent to your phone!');
      } else {
        toast.success('Account created! Sign in to continue.');
        navigate('/vendor/login');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP to activate account
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      await api.post('/auth/vendor/signup/verify-otp', { phone: signupPhone, otp });
      toast.success('Phone verified! Your store is now active.', { duration: 4000 });
      navigate('/vendor/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendSignupOtp = async () => {
    try {
      await api.post('/auth/vendor/signup/send-otp', { phone: signupPhone });
      toast.success('OTP resent!');
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  // ── OTP verification step ─────────────────────────────────────────────────
  if (step === 'otp') return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, background: '#16a34a', borderRadius: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 26 }}>📱</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Verify your phone</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 28px' }}>
          We sent a 6-digit code to <strong>{signupPhone}</strong>
        </p>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e5e7eb', padding: '28px 26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit OTP"
              style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 10, padding: '14px', fontSize: 22, textAlign: 'center', letterSpacing: 10, color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              style={{ width: '100%', marginTop: 16, background: (loading || otp.length !== 6) ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 11, padding: '13px', fontSize: 15, fontWeight: 700, cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Verifying…' : 'Activate My Store →'}
            </button>
          </form>
          <button onClick={resendSignupOtp} style={{ marginTop: 14, background: 'none', border: 'none', color: '#16a34a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Didn't receive it? Resend OTP
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: '#16a34a', borderRadius: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Zap size={26} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Launch Your Store</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '6px 0 0' }}>Register on QuickStore — it's free to start</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e5e7eb', padding: '28px 26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSubmit}>

            {/* Store Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Store Name *</label>
              <input
                type="text"
                value={form.storeName}
                onChange={set('storeName')}
                placeholder="e.g. Ganesh Kirana Store"
                style={{ width: '100%', border: `1.5px solid ${errors.storeName ? '#ef4444' : '#d1d5db'}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = errors.storeName ? '#ef4444' : '#d1d5db'}
              />
              {previewSlug && <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>Your store URL: /store/{previewSlug}</p>}
              {errors.storeName && <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>{errors.storeName}</p>}
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Mobile Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+91 98765 43210"
                style={{ width: '100%', border: `1.5px solid ${errors.phone ? '#ef4444' : '#d1d5db'}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = errors.phone ? '#ef4444' : '#d1d5db'}
              />
              {errors.phone && <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>{errors.phone}</p>}
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                style={{ width: '100%', border: `1.5px solid ${errors.email ? '#ef4444' : '#d1d5db'}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = errors.email ? '#ef4444' : '#d1d5db'}
              />
              {errors.email && <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Minimum 8 characters"
                style={{ width: '100%', border: `1.5px solid ${errors.password ? '#ef4444' : '#d1d5db'}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = errors.password ? '#ef4444' : '#d1d5db'}
              />
              {errors.password && <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: loading ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 11, padding: '13px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 18, marginBottom: 0 }}>
            Already registered?{' '}
            <Link to="/vendor/login" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 16 }}>
          By signing up you agree to QuickStore's Terms of Service
        </p>
      </div>
    </div>
  );
}
