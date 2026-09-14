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
  onboardedTenants: Record<string, boolean>; // per-tenant onboarding status
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
      onboardedTenants: {},

      setAuth: (token, refreshToken, role, email, tenantId) =>
        set(state => ({
          token, refreshToken, role, email, tenantId,
          tenantSlug: '',  // always clear stale slug — fresh fetch sets the correct one
          // Returning vendor: look up their per-tenant onboarding status
          // New vendor (tenantId not seen before): defaults to false → goes to onboarding
          onboarded: state.onboardedTenants[tenantId] ?? false,
        })),

      setTenantSlug: (tenantSlug) => set({ tenantSlug }),

      setOnboarded: (onboarded) =>
        set(state => ({
          onboarded,
          // Remember this tenant has completed onboarding — survives logout/re-login
          onboardedTenants: { ...state.onboardedTenants, [state.tenantId]: onboarded },
        })),

      setCustomerAuth: (token, phone, tenantId) =>
        set({ token, refreshToken: null, role: 'CUSTOMER', email: phone, tenantId }),

      logout: () =>
        set({ token: null, refreshToken: null, role: '', email: '', tenantId: '', tenantSlug: '' }),
        // onboardedTenants intentionally kept — returning vendors skip the wizard
    }),
    { name: 'qs-auth' },
  ),
);
