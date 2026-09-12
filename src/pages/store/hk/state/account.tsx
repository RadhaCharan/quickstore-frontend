import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CustomerAddress, CustomerOrderSummary, CustomerSession } from '../types';
import { api, setAccountToken } from '../api/client';

interface AddressInput { label?: string; line1: string; line2?: string; city: string; pincode: string; isDefault?: boolean; }

interface AccountContextValue {
  customer: CustomerSession | null;
  token: string | null;
  addresses: CustomerAddress[];
  orders: CustomerOrderSummary[];
  ordersLoaded: boolean;
  requestOtp: (phone: string) => Promise<{ sent: true; devCode?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => void;
  updateName: (name: string) => Promise<void>;
  loadOrders: () => Promise<void>;
  addAddress: (input: AddressInput) => Promise<void>;
  updateAddress: (id: string, input: AddressInput) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | null>(null);
function storageKey(slug: string) { return `qs:account:${slug}`; }

export function AccountProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem(storageKey(slug)); } catch { return null; }
  });
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  const persistToken = useCallback((next: string | null) => {
    setToken(next);
    setAccountToken(next);
    try {
      if (next) localStorage.setItem(storageKey(slug), next);
      else localStorage.removeItem(storageKey(slug));
    } catch {}
  }, [slug]);

  useEffect(() => {
    setAccountToken(token);
    if (!token) { setCustomer(null); setAddresses([]); setOrders([]); setOrdersLoaded(false); return; }
    api.account.me(token).then(r => { setCustomer(r.customer); setAddresses(r.addresses); }).catch(() => persistToken(null));
  }, [token, persistToken]);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const r = await api.account.verifyOtp(phone, code);
    persistToken(r.accessToken);
    setCustomer(r.customer);
  }, [persistToken]);

  const updateName = useCallback(async (name: string) => {
    if (!token) return;
    const u = await api.account.updateMe(token, name);
    setCustomer(u);
  }, [token]);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    const r = await api.account.orders(token);
    setOrders(r); setOrdersLoaded(true);
  }, [token]);

  const addAddress = useCallback(async (input: AddressInput) => {
    if (!token) return;
    const c = await api.account.addAddress(token, input);
    setAddresses(a => [...a, c]);
  }, [token]);

  const updateAddress = useCallback(async (id: string, input: AddressInput) => {
    if (!token) return;
    const u = await api.account.updateAddress(token, id, input);
    setAddresses(a => a.map(x => x.id === id ? u : x));
  }, [token]);

  const removeAddress = useCallback(async (id: string) => {
    if (!token) return;
    await api.account.deleteAddress(token, id);
    setAddresses(a => a.filter(x => x.id !== id));
  }, [token]);

  const value = useMemo<AccountContextValue>(() => ({
    customer, token, addresses, orders, ordersLoaded,
    requestOtp: api.account.requestOtp,
    verifyOtp, logout: () => persistToken(null),
    updateName, loadOrders, addAddress, updateAddress, removeAddress,
  }), [customer, token, addresses, orders, ordersLoaded, verifyOtp, persistToken, updateName, loadOrders, addAddress, updateAddress, removeAddress]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used inside AccountProvider');
  return ctx;
}
