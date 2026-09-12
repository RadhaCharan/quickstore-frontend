import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Plus, Pencil, Trash2, Package, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

const inp = { width: '100%', border: '1px solid #d1d5db', borderRadius: 9, padding: '9px 13px', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' };

function Modal({ open, onClose, product, onSave }: any) {
  const blank = { name: '', description: '', price: '', mrp: '', stock: '', unit: 'piece' };
  const [f, setF] = useState<any>(blank);
  useEffect(() => { setF(product || blank); }, [open]);
  if (!open) return null;
  const set = (k: string) => (e: any) => setF((p: any) => ({ ...p, [k]: e.target.value }));
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 6 }}><X size={18} /></button>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['Product Name', 'name', 'text', 'e.g. Amul Milk 500ml'], ['Description', 'description', 'text', 'Optional'], ['Selling Price (₹)', 'price', 'number', '0'], ['MRP (₹)', 'mrp', 'number', '0'], ['Stock Qty', 'stock', 'number', '0']].map(([lbl, key, type, ph]) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>{lbl}</label>
              <input type={type} value={f[key] || ''} onChange={set(key)} placeholder={ph} style={inp} onFocus={e => e.target.style.borderColor='#16a34a'} onBlur={e => e.target.style.borderColor='#d1d5db'} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Unit</label>
            <select value={f.unit} onChange={set('unit')} style={{ ...inp }}>
              {['piece','kg','gram','litre','ml','pack','dozen'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '14px 22px', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 9, padding: '10px', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#374151' }}>Cancel</button>
          <button onClick={() => onSave(f)} style={{ flex: 1, background: '#16a34a', border: 'none', borderRadius: 9, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
            {product ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorProducts() {
  const [modal, setModal] = useState<{ open: boolean; product?: any }>({ open: false });
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => {
      const d = r.data;
      if (Array.isArray(d)) return d;
      if (Array.isArray(d?.items)) return d.items;
      return [];
    }),
  });

  const filtered = useMemo(() => products.filter((p: any) => !search || p.name.toLowerCase().includes(search.toLowerCase())), [products, search]);

  const save = useMutation({ mutationFn: (f: any) => f.id ? api.patch(`/products/${f.id}`, f) : api.post('/products', f), onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModal({ open: false }); toast.success('Saved!'); }, onError: () => toast.error('Failed') });
  const del  = useMutation({ mutationFn: (id: string) => api.delete(`/products/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Removed'); } });

  const disc = (p: any) => p.mrp && p.mrp > p.price ? Math.round((p.mrp - p.price) / p.mrp * 100) : null;

  return (
    <div style={{ padding: 28, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Products</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{products.length} products in your catalogue</p>
        </div>
        <button onClick={() => setModal({ open: true })} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 18, maxWidth: 320 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ ...inp, paddingLeft: 34 }} />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 64, textAlign: 'center' }}>
          <Package size={40} color="#d1d5db" style={{ display: 'block', margin: '0 auto 14px' }} />
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 16px' }}>No products yet. Add your first one.</p>
          <button onClick={() => setModal({ open: true })} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Product</button>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['Product', 'Price', 'MRP', 'Stock', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', color: '#6b7280', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => {
                const d = disc(p);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                          {p.images?.[0] ? <img src={p.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} alt="" /> : '📦'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{p.name}</div>
                          {p.unit && <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.unit}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: '#16a34a', fontSize: 14 }}>₹{p.price}</td>
                    <td style={{ padding: '13px 16px', color: '#9ca3af', textDecoration: 'line-through' }}>{p.mrp ? `₹${p.mrp}` : '—'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 20, background: p.stock < 5 ? '#fef2f2' : '#f0fdf4', color: p.stock < 5 ? '#ef4444' : '#16a34a', fontWeight: 500 }}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 20, background: p.isActive ? '#f0fdf4' : '#f9fafb', color: p.isActive ? '#16a34a' : '#9ca3af', fontWeight: 500 }}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setModal({ open: true, product: p })} style={{ background: '#f0fdf4', border: 'none', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#16a34a' }}><Pencil size={13} /></button>
                        <button onClick={() => del.mutate(p.id)} style={{ background: '#fef2f2', border: 'none', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false })} product={modal.product} onSave={(f: any) => save.mutate(f)} />
    </div>
  );
}
