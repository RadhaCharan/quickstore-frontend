import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tenantApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useStorefrontStore } from '../../store/storefrontStore';
import toast from 'react-hot-toast';

export default function CustomerLogin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { setCustomerAuth } = useAuthStore();
  const { config } = useStorefrontStore();
  const primaryColor = config?.primaryColor || '#16a34a';

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const { data } = await tenantApi(slug!).post('/auth/customer/send-otp', { phone });
      setOtpSent(true);
      if (import.meta.env.DEV && data?.otp) {
        setOtp(data.otp);
        toast.success(`OTP sent! (dev: ${data.otp})`);
      } else {
        toast.success('OTP sent!');
      }
    } catch {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const { data } = await tenantApi(slug!).post('/auth/customer/verify-otp', { phone, otp });
      setCustomerAuth(data.accessToken, data.phone, slug!);
      navigate(`/store/${slug}/checkout`);
    } catch {
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-store min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-6">
            <p className="text-3xl mb-2">📱</p>
            <h1 className="text-xl font-bold">{config?.storeName || 'Store'}</h1>
            <p className="text-sm opacity-60 mt-1">Sign in to continue</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs opacity-60 mb-1 block">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={otpSent}
                placeholder="+91 98765 43210"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>

            {!otpSent ? (
              <button
                onClick={sendOtp}
                disabled={loading || !phone}
                className="w-full py-3 rounded-xl font-medium text-white disabled:opacity-40"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            ) : (
              <>
                <div>
                  <label className="text-xs opacity-60 mb-1 block">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none tracking-widest text-center text-lg"
                  />
                </div>
                <button
                  onClick={verifyOtp}
                  disabled={loading || otp.length < 6}
                  className="w-full py-3 rounded-xl font-medium text-white disabled:opacity-40"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? 'Verifying…' : 'Verify & Continue →'}
                </button>
                <button onClick={() => setOtpSent(false)} className="w-full text-sm opacity-50 hover:opacity-80">
                  Change number
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
