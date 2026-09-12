import { create } from 'zustand';

export interface StorefrontConfig {
  theme: 'QUICKCART' | 'FRESHMART' | 'STYLEHUB' | 'LOCALPRO';
  storeName: string;
  tagline: string;
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  contactPhone: string;
  deliveryFee: number;
  minOrderAmount: number;
  freeDeliveryAbove: number;
  enabledFeatures: string[];
}

interface StorefrontState {
  config: StorefrontConfig | null;
  slug: string;
  isLoading: boolean;
  setConfig: (slug: string, config: StorefrontConfig) => void;
  setLoading: (v: boolean) => void;
  hasFeature: (feature: string) => boolean;
}

const DEFAULT_CONFIG: StorefrontConfig = {
  theme: 'QUICKCART',
  storeName: 'QuickStore',
  tagline: 'Fresh products delivered fast',
  logoUrl: '',
  bannerUrl: '',
  primaryColor: '#16a34a',
  contactPhone: '',
  deliveryFee: 0,
  minOrderAmount: 0,
  freeDeliveryAbove: 0,
  enabledFeatures: ['PRODUCTS', 'ORDERS'],
};

export const useStorefrontStore = create<StorefrontState>((set, get) => ({
  config: null,
  slug: '',
  isLoading: false,

  setConfig: (slug, config) => {
    set({ slug, config });
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', config.theme);
    if (config.primaryColor) {
      document.documentElement.style.setProperty('--color-brand-500', config.primaryColor);
    }
  },

  setLoading: (v) => set({ isLoading: v }),

  hasFeature: (feature) => {
    const { config } = get();
    return config?.enabledFeatures?.includes(feature) ?? false;
  },
}));
