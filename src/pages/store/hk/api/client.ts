/**
 * QuickStore-adapted API client for the HyperKart storefront.
 * Maps HyperKart's /shop/* endpoints to our QuickStore backend,
 * converting rupees ↔ paise as needed.
 */
import type {
  StorefrontBootstrap, ProductSummary, ProductDetail,
  ProductReviewsPage, ValidatedCart, CustomerSession,
  CustomerAddress, CustomerOrderSummary, CartLineInput,
} from '../types';

const QS_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

// Current slug — set by StoreRoot before any API call fires
let _slug = '';
let _token: string | null = null;

export function setSlug(slug: string) { _slug = slug; }
export function setAccountToken(token: string | null) { _token = token; }

async function qs<T>(path: string, init?: RequestInit & { token?: string | null }): Promise<T> {
  const { token: reqToken, ...rest } = init ?? {};
  const tok = reqToken ?? _token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-Slug': _slug,
  };
  if (tok) headers['Authorization'] = `Bearer ${tok}`;

  const res = await fetch(`${QS_BASE}${path}`, { ...rest, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? 'Something went wrong', res.status);
  }
  return res.json();
}

// ── Price conversions ─────────────────────────────────────────────────────────
const toP = (r: number | null | undefined): number => Math.round((r ?? 0) * 100);

function mapProduct(p: any): ProductSummary {
  return {
    id: p.id,
    slug: p.id,                    // our backend uses id, not slug
    name: p.name,
    unit: p.unit || null,
    description: p.description || null,
    pricePaise: toP(p.price),
    mrpPaise: p.mrp && p.mrp > p.price ? toP(p.mrp) : null,
    stockQty: p.stock ?? null,
    inStock: p.inStock ?? (p.stock > 0),
    images: p.images || [],
  };
}

// ── Main API object ───────────────────────────────────────────────────────────
export const api = {
  bootstrap: async (): Promise<StorefrontBootstrap> => {
    const d = await qs<any>(`/storefront/${_slug}/bootstrap`);
    return {
      store: {
        id: d.store.id,
        slug: d.store.slug,
        storeName: d.store.storeName,
        tagline: d.store.tagline || null,
        logoUrl: d.store.logoUrl || null,
        bannerUrl: d.store.bannerUrl || null,
        deliveryFeePaise: toP(d.delivery?.fee),
        minOrderPaise: toP(d.delivery?.minOrderAmount),
        freeAbovePaise: d.delivery?.freeAbove ? toP(d.delivery.freeAbove) : null,
        contactPhone: d.store.contactPhone || null,
      },
      theme: d.theme,
      features: d.features || [],
      categories: (d.categories || []).map((c: any) => ({
        id: c.id, name: c.name, slug: c.slug,
        imageUrl: c.imageUrl || null,
        productCount: c.productCount || 0,
      })),
      featuredProducts: (d.featuredProducts || []).map(mapProduct),
    };
  },

  products: async (params: { categoryId?: string; q?: string } = {}): Promise<{ items: ProductSummary[]; total: number }> => {
    const sp = new URLSearchParams();
    if (params.categoryId) sp.set('categoryId', params.categoryId);
    if (params.q) sp.set('search', params.q);
    sp.set('limit', '40');
    const d = await qs<any>(`/storefront/${_slug}/products?${sp.toString()}`);
    const items = Array.isArray(d) ? d : (d.items || []);
    return { items: items.map(mapProduct), total: d.total || items.length };
  },

  product: async (id: string): Promise<ProductDetail> => {
    const p = await qs<any>(`/storefront/${_slug}/products/${id}`);
    return { ...mapProduct(p), categoryId: p.category_id || p.categoryId || null };
  },

  reviews: async (_id: string): Promise<ProductReviewsPage> =>
    ({ count: 0, average: null, items: [] }),

  addReview: async (_id: string, _payload: any, _token: string) =>
    ({ ok: true as const }),

  validateCart: async (lines: CartLineInput[]): Promise<ValidatedCart> =>
    ({ lines: lines.map(l => ({ productId: l.productId, name: '', qty: l.qty })), removed: [], deliveryFeePaise: 0 }),

  checkout: async (payload: any) => {
    const body = {
      items: payload.lines.map((l: any) => ({ productId: l.productId, quantity: l.qty })),
      paymentMode: 'COD',
      address: {
        line1: payload.address.line1,
        line2: payload.address.line2,
        city: payload.address.city,
        pincode: payload.address.pincode,
      },
      notes: payload.notes,
    };
    const res = await qs<any>('/orders', { method: 'POST', body: JSON.stringify(body) });
    return {
      orderId: res.id,
      code: res.orderNumber || res.id,
      totalPaise: toP(res.total),
      payment: { provider: 'cod' as const },
    };
  },

  confirmRazorpay: async (_payload: any) => ({ verified: true }),

  track: async (orderIdOrCode: string, _phone: string) => {
    const d = await qs<any>(`/orders/${orderIdOrCode}`);
    return {
      order: {
        code: d.orderNumber || d.id,
        status: (d.status || 'placed').toLowerCase(),
        payment_status: (d.paymentStatus || 'pending').toLowerCase(),
        total_paise: toP(d.total),
        placed_at: d.createdAt,
      },
      timeline: [
        { to_status: 'placed', note: null, created_at: d.createdAt },
        ...(d.status !== 'PLACED' ? [{ to_status: 'confirmed', note: null, created_at: d.updatedAt }] : []),
        ...(['PREPARING','OUT_FOR_DELIVERY','DELIVERED'].includes(d.status) ? [{ to_status: 'packed', note: null, created_at: d.updatedAt }] : []),
        ...(['OUT_FOR_DELIVERY','DELIVERED'].includes(d.status) ? [{ to_status: 'out_for_delivery', note: null, created_at: d.updatedAt }] : []),
        ...(d.status === 'DELIVERED' ? [{ to_status: 'delivered', note: null, created_at: d.updatedAt }] : []),
      ],
      items: (d.items || []).map((i: any) => ({
        name_snapshot: i.productName || i.name,
        unit_snapshot: null,
        price_paise: toP(i.price),
        qty: i.quantity,
        line_total_paise: toP(i.subtotal || i.price * i.quantity),
        image: null,
      })),
    };
  },

  account: {
    requestOtp: async (phone: string) => {
      await qs('/auth/customer/send-otp', { method: 'POST', body: JSON.stringify({ phone }) });
      return { sent: true as const };
    },

    verifyOtp: async (phone: string, code: string) => {
      const d = await qs<any>('/auth/customer/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp: code }) });
      return { accessToken: d.accessToken, customer: { id: phone, phone, name: null } as CustomerSession };
    },

    me: async (token: string) => {
      const d = await qs<any>('/customers/me/profile', { token });
      return {
        customer: { id: d.id || d.phone, phone: d.phone, name: d.name || null } as CustomerSession,
        addresses: [] as CustomerAddress[],
      };
    },

    updateMe: async (token: string, name: string) => {
      await qs('/customers/me/profile', { method: 'PATCH', body: JSON.stringify({ name }), token });
      return { id: '', phone: '', name } as CustomerSession;
    },

    orders: async (token: string): Promise<CustomerOrderSummary[]> => {
      const d = await qs<any>('/orders', { token });
      const items = Array.isArray(d) ? d : (d.items || []);
      return items.map((o: any) => ({ id: o.id, orderNumber: o.orderNumber, status: o.status, total: o.total, createdAt: o.createdAt }));
    },

    addresses: async (token: string): Promise<CustomerAddress[]> => {
      const d = await qs<any>('/customers/me/addresses', { token });
      return (Array.isArray(d) ? d : []).map((a: any) => ({
        id: a.id, label: a.label || 'Home', line1: a.line1, line2: a.line2 || null,
        city: a.city, pincode: a.pincode, isDefault: a.isDefault || false,
      }));
    },

    addAddress: async (token: string, input: any): Promise<CustomerAddress> => {
      const d = await qs<any>('/customers/me/addresses', { method: 'POST', body: JSON.stringify(input), token });
      return { id: d.id, label: d.label || 'Home', line1: d.line1, line2: d.line2 || null, city: d.city, pincode: d.pincode, isDefault: d.isDefault || false };
    },

    updateAddress: async (token: string, id: string, input: any): Promise<CustomerAddress> => {
      const d = await qs<any>(`/customers/me/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(input), token });
      return { id: d.id, label: d.label || 'Home', line1: d.line1, line2: d.line2 || null, city: d.city, pincode: d.pincode, isDefault: d.isDefault || false };
    },

    deleteAddress: async (token: string, id: string) => {
      await qs(`/customers/me/addresses/${id}`, { method: 'DELETE', token });
      return { ok: true as const };
    },
  },
};

// AddressInput exported here so account.tsx can import it from the same place as api
export interface AddressInput {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}
