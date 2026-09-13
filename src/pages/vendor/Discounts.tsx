import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { safeFormat } from '../../shared/utils/date';

const blankForm = { code: '', type: 'PERCENTAGE', value: '', minOrderAmt: '', usageLimit: '', validUntil: '' };

export default function VendorDiscounts() {
  const [modal, setModal] = useState<{ open: boolean; discount?: any }>({ open: false });
  const [form, setForm] = useState<any>(blankForm);
  const qc = useQueryClient();

  useEffect(() => {
    if (!modal.open) return;
    setForm(modal.discount ? {
      code: modal.discount.code,
      type: modal.discount.type,
      value: modal.discount.value,
      minOrderAmt: modal.discount.minOrderAmt || '',
      usageLimit: modal.discount.usageLimit || '',
      validUntil: modal.discount.validUntil ? modal.discount.validUntil.slice(0, 10) : '',
    } : blankForm);
  }, [modal]);

  const { data: discounts = [] } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => api.get('/discounts').then((r) => r.data),
  });

  const save = useMutation({
    mutationFn: () => modal.discount
      ? api.patch(`/discounts/${modal.discount.id}`, form)
      : api.post('/discounts', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discounts'] }); setModal({ open: false }); toast.success(modal.discount ? 'Coupon updated!' : 'Coupon created!'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save coupon'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: any) => api.patch(`/discounts/${id}`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discounts'] }); toast.success('Status updated'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update status'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/discounts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discounts'] }); toast.success('Coupon deleted'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete coupon'),
  });

  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Discounts & Coupons</h1>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {discounts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Tag size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No coupons yet. Create your first discount.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {discounts.map((d: any) => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono font-bold text-lg text-gray-900">{d.code}</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {d.type === 'PERCENTAGE' ? `${d.value}% off` : `₹${d.value} off`}
                    {d.minOrderAmt > 0 && ` on orders above ₹${d.minOrderAmt}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Used {d.usedCount} / {d.usageLimit || '∞'} times
                    {d.validUntil && ` · Expires ${safeFormat(d.validUntil, 'dd MMM yyyy')}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => toggleActive.mutate({ id: d.id, isActive: !d.isActive })}
                    className={`px-2 py-0.5 rounded-full text-xs cursor-pointer ${d.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    title={d.isActive ? 'Click to deactivate' : 'Click to activate'}
                  >
                    {d.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setModal({ open: true, discount: d })}
                      className="p-1.5 rounded-md bg-gray-50 text-gray-500 hover:bg-gray-100"
                      aria-label="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => { if (window.confirm(`Delete coupon ${d.code}? This can't be undone.`)) remove.mutate(d.id); }}
                      className="p-1.5 rounded-md bg-red-50 text-red-500 hover:bg-red-100"
                      aria-label="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-semibold mb-4">{modal.discount ? 'Edit Coupon' : 'Create Coupon'}</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Coupon code (e.g. SAVE20)" value={form.code} onChange={set('code')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 uppercase" />
              <select value={form.type} onChange={set('type')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="PERCENTAGE">Percentage (%) off</option>
                <option value="FLAT">Flat (₹) off</option>
              </select>
              <input type="number" placeholder="Discount value" value={form.value} onChange={set('value')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <input type="number" placeholder="Minimum order amount (₹)" value={form.minOrderAmt} onChange={set('minOrderAmt')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <input type="number" placeholder="Usage limit (leave blank for unlimited)" value={form.usageLimit} onChange={set('usageLimit')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <input type="date" placeholder="Expiry date" value={form.validUntil} onChange={set('validUntil')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal({ open: false })} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={() => save.mutate()} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700">
                {modal.discount ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
