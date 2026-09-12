import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FEATURE_LABELS } from '../../shared/constants/features';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle2, Circle } from 'lucide-react';

const SELECTABLE_FEATURES = [
  'PRODUCTS', 'CATEGORIES', 'ORDERS', 'SEARCH',
  'CUSTOMER_ACCOUNTS', 'SAVED_ADDRESSES', 'DISCOUNTS', 'DELIVERY_TRACKING',
] as const;

export default function FeatureSelector() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>(['PRODUCTS', 'ORDERS']);
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggle = (f: string) =>
    setSelected((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const handleSubmit = async () => {
    try {
      await api.patch('/tenant/me', { requestedFeatures: selected, storeDescription: description });
      setSubmitted(true);
    } catch {
      toast.error('Failed to submit. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900">Request Submitted!</h2>
          <p className="text-gray-500 mt-3">
            Our team is reviewing your request. You'll receive an email with your login link within 24 hours.
          </p>
          <button
            onClick={() => navigate('/vendor/login')}
            className="mt-6 bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Select Your Features</h2>
          <p className="text-gray-500 text-sm mb-6">Pick what you need. Our team will activate them for you.</p>

          <div className="grid grid-cols-1 gap-3 mb-6">
            {SELECTABLE_FEATURES.map((feature) => {
              const active = selected.includes(feature);
              return (
                <button
                  key={feature}
                  onClick={() => toggle(feature)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                    active
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {active ? (
                    <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-gray-300 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium">{FEATURE_LABELS[feature]}</span>
                </button>
              );
            })}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe your store (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="e.g. I run a small kirana shop in Pune and want to take orders online..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={selected.length === 0}
            className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}
