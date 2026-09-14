import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  role: string;
  email: string;
  tenantId: string;
  tenantSlug: string;
  onboarded: boolean;
  setAuth: (token: string, refreshToken: string, role: string, email: string, tenantId: string) => void;
  setTenantSlug: (slug: string) => void;
  setOnboarded: (v: boolean) => void;
  setCustomerAuth: (token: string, phone: string, tenantId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      role: '',
      email: '',
      tenantId: '',
      tenantSlug: '',
      onboarded: false,
      setAuth: (token, refreshToken, role, email, tenantId) =>
        set({ token, refreshToken, role, email, tenantId, onboarded: false }),
      setTenantSlug: (tenantSlug) => set({ tenantSlug }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setCustomerAuth: (token, phone, tenantId) =>
        set({ token, refreshToken: null, role: 'CUSTOMER', email: phone, tenantId }),
      logout: () =>
        set({ token: null, refreshToken: null, role: '', email: '', tenantId: '', tenantSlug: '' }),
        // Note: onboarded intentionally NOT reset — survives logout so returning vendors skip the wizard
    }),
    { name: 'qs-auth' },
  ),
);
