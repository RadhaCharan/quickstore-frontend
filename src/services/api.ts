import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1';

export const api = axios.create({ baseURL: BASE_URL });

// Attach JWT + tenant slug on every request
api.interceptors.request.use((config) => {
  const { token, tenantSlug } = useAuthStore.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantSlug) config.headers['X-Tenant-Slug'] = tenantSlug;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/vendor/login';
    }
    return Promise.reject(err);
  },
);

// Uploads an image (product photo, category icon, store logo/banner) and returns its public URL.
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/uploads', formData);
  return data.url;
}

// Tenant-scoped API (attaches X-Tenant-Slug header)
export const tenantApi = (slug: string) => {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: { 'X-Tenant-Slug': slug },
  });
  instance.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return instance;
};
