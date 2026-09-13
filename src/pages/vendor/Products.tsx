import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, uploadImage } from '../../services/api';
import { Plus, Pencil, Trash2, Package, Search, X, ImagePlus, UploadCloud, FileDown, FileUp, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const inp = { width: '100%', border: '1px solid #d1d5db', borderRadius: 9, padding: '9px 13px', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' };
const BASE_UNIT_TYPES = ['piece', 'kg', 'gram', 'litre', 'ml', 'pack', 'dozen'];

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return debounced;
}

// Existing rows only store a single free-text `unit` column (e.g. "500 gram", or bare "piece").
// Split it into a quantity + unit-type pair for the form, and re-join on save.
function splitUnit(raw?: string) {
  const s = (raw || 'piece').trim();
  const m = /^([\d.]+)\s+(.+)$/.exec(s);
  return m ? { unitValue: m[1], unitType: m[2] } : { unitValue: '', unitType: s || 'piece' };
}
function joinUnit(unitValue: string, unitType: string) {
  const v = unitValue.trim();
  return v ? `${v} ${unitType}` : unitType;
}

function Modal({ open, onClose, product, onSave }: any) {
  const blank = { name: '', description: '', price: '', mrp: '', stock: '', unitValue: '', unitType: 'piece', categoryId: '', images: [] as string[] };
  const [f, setF] = useState<any>(blank);
  const [imageDraft, setImageDraft] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) setF({ ...blank, ...product, ...splitUnit(product.unit) });
    else setF(blank);
    setImageDraft('');
  }, [open]);

  // The dropdown needs every category to choose from, not one paginated page of them.
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => api.get('/categories', { params: { limit: 500 } }).then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
    }),
    enabled: open,
  });

  if (!open) return null;
  const set = (k: string) => (e: any) => setF((p: any) => ({ ...p, [k]: e.target.value }));
  const unitTypeOptions = BASE_UNIT_TYPES.includes(f.unitType) ? BASE_UNIT_TYPES : [f.unitType, ...BASE_UNIT_TYPES];

  const addImage = () => {
    const url = imageDraft.trim();
    if (!url) return;
    setF((p: any) => ({ ...p, images: [...(p.images || []), url] }));
    setImageDraft('');
  };
  const removeImage = (i: number) => setF((p: any) => ({ ...p, images: p.images.filter((_: string, idx: number) => idx !== i) }));

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again later
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setF((p: any) => ({ ...p, images: [...(p.images || []), url] }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => onSave({ ...f, unit: joinUnit(f.unitValue, f.unitType) });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
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
            <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Quantity / Unit</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 8 }}>
              <input type="number" min="0" step="any" value={f.unitValue} onChange={set('unitValue')} placeholder="e.g. 500" style={inp} />
              <select value={f.unitType} onChange={set('unitType')} style={{ ...inp }}>
                {unitTypeOptions.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '5px 0 0' }}>
              e.g. "500" + "gram" for a 500g pack, or leave quantity blank for a plain "{f.unitType}". Shown on the storefront as "{joinUnit(f.unitValue, f.unitType)}".
            </p>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Category</label>
            <select value={f.categoryId || ''} onChange={set('categoryId')} style={{ ...inp }}>
              <option value="">No category</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Photos</label>
            {f.images?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {f.images.map((url: string, i: number) => (
                  <div key={i} style={{ position: 'relative', width: 52, height: 52 }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: 10, lineHeight: '14px', padding: 0 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={imageDraft} onChange={e => setImageDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())} placeholder="Paste an image URL…" style={{ ...inp, flex: 1 }} />
              <button onClick={addImage} type="button" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, padding: '0 12px', color: '#16a34a', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                <ImagePlus size={14} /> Add
              </button>
              <button onClick={() => fileInputRef.current?.click()} type="button" disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 9, padding: '0 12px', color: '#1d4ed8', fontSize: 12, fontWeight: 600, cursor: uploading ? 'default' : 'pointer', flexShrink: 0, opacity: uploading ? 0.6 : 1 }}>
                <UploadCloud size={14} /> {uploading ? 'Uploading…' : 'From device'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFilePicked} style={{ display: 'none' }} />
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '5px 0 0' }}>Paste a URL or upload straight from your device — add as many as you like, the first is the main thumbnail.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '14px 22px', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 9, padding: '10px', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#374151' }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 1, background: '#16a34a', border: 'none', borderRadius: 9, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
            {product ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkImportModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; categoriesCreated: number; skipped: { row: number; reason: string }[]; totalRows: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setResult(null); }, [open]);
  if (!open) return null;

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/products/bulk-import/template', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = 'product-import-template.csv';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download the template');
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/products/bulk-import', formData);
      setResult(data);
      if (data.created > 0 || data.categoriesCreated > 0) onImported();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>Bulk Upload Products</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 6 }}><X size={18} /></button>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
            Upload a CSV with columns <code>name, description, price, mrp, stock, unit, category</code> —
            <code> name</code>, <code>price</code> and <code>stock</code> are required. A <code>category</code>
            is matched by name against your existing categories, and <strong>created automatically</strong> if
            it doesn't exist yet — you won't need to add categories by hand first.
          </p>
          <button onClick={downloadTemplate} type="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 9, padding: '9px', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <FileDown size={15} /> Download sample CSV
          </button>
          <button onClick={() => fileInputRef.current?.click()} type="button" disabled={importing} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#16a34a', border: 'none', borderRadius: 9, padding: '10px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: importing ? 'default' : 'pointer', opacity: importing ? 0.6 : 1 }}>
            <UploadCloud size={15} /> {importing ? 'Importing…' : 'Choose CSV & Import'}
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: 'none' }} />

          {result && (
            <div style={{ background: result.created > 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${result.created > 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 9, padding: '10px 12px', fontSize: 12.5, color: '#374151' }}>
              <div style={{ fontWeight: 700, color: result.created > 0 ? '#15803d' : '#b91c1c' }}>
                {result.created} of {result.totalRows} row{result.totalRows === 1 ? '' : 's'} imported
              </div>
              {result.categoriesCreated > 0 && (
                <div style={{ marginTop: 4 }}>+ {result.categoriesCreated} new categor{result.categoriesCreated === 1 ? 'y' : 'ies'} created</div>
              )}
              {result.skipped.length > 0 && <div style={{ height: 6 }} />}
              {result.skipped.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 18, maxHeight: 120, overflowY: 'auto' }}>
                  {result.skipped.map((s, i) => <li key={i}>Row {s.row}: {s.reason}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', padding: '14px 22px', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 9, padding: '10px', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#374151' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZES = [20, 50, 100];

export default function VendorProducts() {
  const [modal, setModal] = useState<{ open: boolean; product?: any }>({ open: false });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 300);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });
  const qc = useQueryClient();

  // A new search/sort/page-size invalidates whatever page you were on.
  useEffect(() => { setPage(1); }, [debouncedSearch, sort, limit]);

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['products', page, limit, debouncedSearch, sort.key, sort.dir],
    queryFn: () => api.get('/products', {
      params: { page, limit, search: debouncedSearch || undefined, sortBy: sort.key, sortDir: sort.dir },
    }).then(r => {
      const d = r.data;
      const rows = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.items) ? d.items : [];
      // The API returns raw DB rows (snake_case) — normalize the couple of fields the UI reads
      // in camelCase so "is_active"/"category_id" don't silently read as undefined here.
      const items = rows.map((p: any) => ({
        ...p,
        isActive: p.isActive ?? p.is_active,
        categoryId: p.categoryId ?? p.category_id ?? '',
        categoryName: p.categoryName ?? p.category_name ?? null,
      }));
      return { items, total: d?.total ?? items.length, totalPages: d?.totalPages ?? 1 };
    }),
    placeholderData: keepPreviousData, // keep showing the current page while the next loads, instead of flashing empty
  });

  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  const toggleSort = (key: string) => setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });

  const save = useMutation({
    mutationFn: (f: any) => {
      // Editing pre-fills the form from the raw DB row (id, created_at, is_active, category_id, …).
      // The API rejects any field it doesn't know about, so build an explicit, whitelisted body
      // instead of forwarding everything the form happens to be carrying.
      const body = {
        name: f.name,
        description: f.description || undefined,
        price: f.price === '' ? undefined : Number(f.price),
        mrp: f.mrp === '' || f.mrp == null ? undefined : Number(f.mrp),
        stock: f.stock === '' ? undefined : Number(f.stock),
        unit: f.unit,
        categoryId: f.categoryId || undefined,
        images: f.images || [],
      };
      return f.id ? api.patch(`/products/${f.id}`, body) : api.post('/products', body);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModal({ open: false }); toast.success('Saved!'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save product'),
  });
  const del  = useMutation({ mutationFn: (id: string) => api.delete(`/products/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Removed'); } });

  const disc = (p: any) => p.mrp && p.mrp > p.price ? Math.round((p.mrp - p.price) / p.mrp * 100) : null;

  return (
    <div style={{ padding: 28, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Products</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{total} product{total === 1 ? '' : 's'} in your catalogue</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setBulkOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 9, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <FileUp size={15} /> Bulk Upload
          </button>
          <button onClick={() => setModal({ open: true })} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', maxWidth: 320, flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all products…" style={{ ...inp, paddingLeft: 34 }} />
        </div>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} style={{ ...inp, width: 'auto', flexShrink: 0 }}>
          {PAGE_SIZES.map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Loading…</div>
      ) : products.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 64, textAlign: 'center' }}>
          <Package size={40} color="#d1d5db" style={{ display: 'block', margin: '0 auto 14px' }} />
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 16px' }}>{search ? 'No products match your search.' : 'No products yet. Add your first one.'}</p>
          {!search && <button onClick={() => setModal({ open: true })} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Product</button>}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {[['Product', 'name'], ['Category', 'category'], ['Price', 'price'], ['MRP', 'mrp'], ['Stock', 'stock'], ['Status', 'status'], ['', null]].map(([h, key]) => (
                  <th key={h || 'actions'} onClick={key ? () => toggleSort(key) : undefined}
                    style={{ padding: '11px 16px', textAlign: 'left', color: '#6b7280', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, cursor: key ? 'pointer' : undefined, userSelect: 'none', whiteSpace: 'nowrap' }}>
                    {h}{key && <span style={{ marginLeft: 4, opacity: sort.key === key ? 1 : 0.25 }}>{sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : '▲'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ opacity: isPlaceholderData ? 0.5 : 1, transition: 'opacity 0.15s' }}>
              {products.map((p: any) => {
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
                    <td style={{ padding: '13px 16px', color: '#374151' }}>{p.categoryName || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: '#16a34a', fontSize: 14 }}>₹{p.price}</td>
                    <td style={{ padding: '13px 16px', color: '#9ca3af', textDecoration: 'line-through' }}>{p.mrp ? `₹${p.mrp}` : '—'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      {/* Stock is a plain count of units — the product's own unit/pack size
                          already shows under its name, so "151 kg" here would misread as
                          151 kilograms rather than 151 units of a 1kg pack. */}
                      <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 20, background: p.stock < 5 ? '#fef2f2' : '#f0fdf4', color: p.stock < 5 ? '#ef4444' : '#16a34a', fontWeight: 500 }}>
                        {p.stock} in stock
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

      {!isLoading && products.length > 0 && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontSize: 13, color: '#6b7280' }}>
          <span>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
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

      <Modal open={modal.open} onClose={() => setModal({ open: false })} product={modal.product} onSave={(f: any) => save.mutate(f)} />
      <BulkImportModal open={bulkOpen} onClose={() => setBulkOpen(false)} onImported={() => { qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['categories'] }); }} />
    </div>
  );
}
