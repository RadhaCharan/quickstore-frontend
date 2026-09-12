import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, uploadImage } from '../../services/api';
import { Plus, Pencil, Trash2, FolderTree, X, UploadCloud, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const inp = { width: '100%', border: '1px solid #d1d5db', borderRadius: 9, padding: '9px 13px', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' };
const PAGE_SIZES = [20, 50, 100];

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return debounced;
}

function Modal({ open, onClose, category, onSave }: any) {
  const blank = { name: '', imageUrl: '', sortOrder: '0' };
  const [f, setF] = useState<any>(blank);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setF(category || blank); }, [open]);
  if (!open) return null;
  const set = (k: string) => (e: any) => setF((p: any) => ({ ...p, [k]: e.target.value }));

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setF((p: any) => ({ ...p, imageUrl: url }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>{category ? 'Edit Category' : 'Add Category'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 6 }}><X size={18} /></button>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Category Name</label>
            <input value={f.name || ''} onChange={set('name')} placeholder="e.g. Dairy & Eggs" style={inp} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Icon / Photo URL</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {f.imageUrl ? <img src={f.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🗂️'}
              </div>
              <input value={f.imageUrl || ''} onChange={set('imageUrl')} placeholder="https://…" style={{ ...inp, flex: 1 }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 9, padding: '0 12px', height: 38, color: '#1d4ed8', fontSize: 12, fontWeight: 600, cursor: uploading ? 'default' : 'pointer', flexShrink: 0, opacity: uploading ? 0.6 : 1 }}>
                <UploadCloud size={14} /> {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFilePicked} style={{ display: 'none' }} />
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '5px 0 0' }}>Paste a URL or upload from your device — shown as the category icon on your storefront.</p>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Sort Order</label>
            <input type="number" value={f.sortOrder ?? '0'} onChange={set('sortOrder')} placeholder="0" style={inp} />
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '5px 0 0' }}>Lower numbers appear first on the storefront.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '14px 22px', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 9, padding: '10px', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#374151' }}>Cancel</button>
          <button onClick={() => onSave(f)} disabled={!f.name?.trim()} style={{ flex: 1, background: '#16a34a', border: 'none', borderRadius: 9, padding: '10px', fontSize: 13, fontWeight: 600, cursor: f.name?.trim() ? 'pointer' : 'not-allowed', opacity: f.name?.trim() ? 1 : 0.6, color: '#fff' }}>
            {category ? 'Save Changes' : 'Add Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorCategories() {
  const [modal, setModal] = useState<{ open: boolean; category?: any }>({ open: false });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 300);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'sortOrder', dir: 'asc' });
  const qc = useQueryClient();

  useEffect(() => { setPage(1); }, [debouncedSearch, sort, limit]);

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['categories', page, limit, debouncedSearch, sort.key, sort.dir],
    queryFn: () => api.get('/categories', {
      params: { page, limit, search: debouncedSearch || undefined, sortBy: sort.key, sortDir: sort.dir },
    }).then(r => {
      const d = r.data;
      const items = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
      return { items, total: d?.total ?? items.length, totalPages: d?.totalPages ?? 1 };
    }),
    placeholderData: keepPreviousData,
  });

  const categories = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const toggleSort = (key: string) => setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });

  const save = useMutation({
    mutationFn: (f: any) => {
      const body = { name: f.name, imageUrl: f.imageUrl || undefined, sortOrder: Number(f.sortOrder) || 0 };
      return f.id ? api.patch(`/categories/${f.id}`, body) : api.post('/categories', body);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setModal({ open: false }); toast.success('Saved!'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save category'),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Removed'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to remove category'),
  });

  return (
    <div style={{ padding: 28, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Categories</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{total} categor{total === 1 ? 'y' : 'ies'} — group your products so shoppers can browse by category.</p>
        </div>
        <button onClick={() => setModal({ open: true })} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Add Category
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', maxWidth: 320, flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories…" style={{ ...inp, paddingLeft: 34 }} />
        </div>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} style={{ ...inp, width: 'auto', flexShrink: 0 }}>
          {PAGE_SIZES.map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Loading…</div>
      ) : categories.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 64, textAlign: 'center' }}>
          <FolderTree size={40} color="#d1d5db" style={{ display: 'block', margin: '0 auto 14px' }} />
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 16px' }}>{search ? 'No categories match your search.' : 'No categories yet. Add one to organise your products.'}</p>
          {!search && <button onClick={() => setModal({ open: true })} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Category</button>}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {[['Category', 'name'], ['Products', 'productCount'], ['Sort order', 'sortOrder'], ['', null]].map(([h, key]) => (
                  <th key={h || 'actions'} onClick={key ? () => toggleSort(key) : undefined}
                    style={{ padding: '11px 16px', textAlign: 'left', color: '#6b7280', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, cursor: key ? 'pointer' : undefined, userSelect: 'none', whiteSpace: 'nowrap' }}>
                    {h}{key && <span style={{ marginLeft: 4, opacity: sort.key === key ? 1 : 0.25 }}>{sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : '▲'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ opacity: isPlaceholderData ? 0.5 : 1, transition: 'opacity 0.15s' }}>
              {categories.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, overflow: 'hidden' }}>
                        {c.image_url || c.imageUrl ? <img src={c.image_url || c.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '🗂️'}
                      </div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{c.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#6b7280' }}>{c.product_count ?? c.productCount ?? 0}</td>
                  <td style={{ padding: '13px 16px', color: '#6b7280' }}>{c.sort_order ?? c.sortOrder ?? 0}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setModal({ open: true, category: { id: c.id, name: c.name, imageUrl: c.image_url || c.imageUrl, sortOrder: c.sort_order ?? c.sortOrder ?? 0 } })} style={{ background: '#f0fdf4', border: 'none', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#16a34a' }}><Pencil size={13} /></button>
                      <button onClick={() => del.mutate(c.id)} style={{ background: '#fef2f2', border: 'none', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && categories.length > 0 && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontSize: 13, color: '#6b7280' }}>
          <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>
              <ChevronLeft size={14} /> Prev
            </button>
            <span>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false })} category={modal.category} onSave={(f: any) => save.mutate(f)} />
    </div>
  );
}
