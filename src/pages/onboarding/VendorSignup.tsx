import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';

export default function VendorSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ phone: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!form.phone.trim())   err.phone    = 'Phone number is required';
    if (!form.email.trim())   err.email    = 'Email is required';
    if (!form.password)       err.password = 'Password is required';
    if (form.password && form.password.length < 8) err.password = 'Minimum 8 characters';
    return err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }

    setLoading(true);
    try {
      // Use email prefix as default store name — vendor customises it in onboarding
      const defaultStoreName = form.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() || 'My Store';
      await api.post('/tenant/signup', {
        name: defaultStoreName,
        ownerName: defaultStoreName,
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        category: 'General',
        requestedFeatures: ['PRODUCTS', 'ORDERS', 'SEARCH', 'CATEGORIES'],
      });
      toast.success('Account created! Sign in to set up your store.', { duration: 4000 });
      navigate('/vendor/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
