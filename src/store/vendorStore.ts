import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VendorState {
  features: string[];       // enabled feature keys for this vendor
  storeName: string;
  slug: string;
  plan: string;
  setVendorConfig: (config: { features: string[]; storeName?: string; slug?: string; plan?: string }) => void;
  hasFeature: (key: string) => boolean;
  clearVendor: () => void;
}

export const useVendorStore = create<VendorState>()(
  persist(
    (set, get) => ({
      features: [],
      storeName: '',
      slug: '',
      plan: '',

      setVendorConfig: (config) =>
        set({
          features:  config.features ?? get().features,
          storeName: config.storeName ?? get().storeName,
          slug:      config.slug      ?? get().slug,
          plan:      config.plan      ?? get().plan,
        }),

      hasFeature: (key) => {
        const { features } = get();
        // If features list is empty (not loaded yet), allow everything
        if (!features.length) return true;
        return features.includes(key);
      },

      clearVendor: () => set({ features: [], storeName: '', slug: '', plan: '' }),
    }),
    { name: 'qs-vendor' },
  ),
);
