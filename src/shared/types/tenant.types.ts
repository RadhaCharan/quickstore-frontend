export type TenantStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';
export type PlanType = 'STARTER' | 'GROWTH' | 'PRO';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  ownerName?: string;
  email: string;
  phone?: string;
  category?: string;
  status: TenantStatus;
  plan: PlanType;
  schemaName?: string;
  createdAt: string;
}

export interface StorefrontConfig {
  theme: 'QUICKCART' | 'FRESHMART' | 'STYLEHUB' | 'LOCALPRO';
  storeName: string;
  tagline?: string;
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor: string;
  contactPhone?: string;
  contactEmail?: string;
  deliveryRadiusKm: number;
  minOrderAmount: number;
  deliveryFee: number;
  freeDeliveryAbove?: number;
  enabledFeatures: string[];
}
