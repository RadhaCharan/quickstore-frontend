// Type stubs that replace @vendorstack/shared imports
// Prices are stored in paise (1 rupee = 100 paise) for display consistency

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  unit: string | null;
  description: string | null;
  pricePaise: number;
  mrpPaise: number | null;
  stockQty: number | null;
  inStock: boolean;
  images: string[];
}

export interface ProductDetail extends ProductSummary {
  categoryId: string | null;
}

export interface ProductReviewsPage {
  count: number;
  average: number | null;
  items: Array<{
    id: string;
    rating: number;
    comment: string | null;
    customerName: string;
    createdAt: string;
  }>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productCount: number;
}

export interface StorefrontBootstrap {
  store: {
    id: string;
    slug: string;
    storeName: string;
    tagline: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    deliveryFeePaise: number;
    minOrderPaise: number;
    freeAbovePaise: number | null;
    contactPhone: string | null;
  };
  theme: { key: string; primaryColor: string };
  features: string[];
  categories: Category[];
  featuredProducts: ProductSummary[];
}

export interface CustomerSession {
  id: string;
  phone: string;
  name: string | null;
}

export interface CustomerAddress {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

export interface CartLineInput {
  productId: string;
  qty: number;
}

export interface ValidatedCart {
  lines: Array<{ productId: string; name: string; qty: number; adjustedFromQty?: number }>;
  removed: Array<{ productId: string; name: string }>;
  deliveryFeePaise: number;
}

// Helpers
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees % 1 === 0 ? rupees : rupees.toFixed(2)}`;
}

export function percentOff(mrpPaise: number, pricePaise: number): number | null {
  if (!mrpPaise || mrpPaise <= pricePaise) return null;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
