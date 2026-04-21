import { clearSession, getToken, saveSession, type Me } from './auth';

const FALLBACK_BASE = 'http://localhost:8000';
const runtimeBase = (globalThis as { __APP_CONFIG__?: { apiBaseUrl?: string } }).__APP_CONFIG__?.apiBaseUrl;
const API_BASE = (runtimeBase ?? import.meta.env.VITE_API_BASE_URL ?? FALLBACK_BASE).replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('authorization', `Bearer ${token}`);

  const resp = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (resp.status === 401) {
    clearSession();
    if (!path.startsWith('/api/admin/auth/login')) {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Требуется повторный вход');
  }
  if (!resp.ok) {
    let message = `${resp.status} ${resp.statusText}`;
    try {
      const j = await resp.json();
      if (typeof j.detail === 'string') message = j.detail;
    } catch {
      // ignore
    }
    throw new ApiError(resp.status, message);
  }
  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

export interface ProductImage {
  id?: string;
  url: string;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  type: 'plant' | 'pot';
  slug: string;
  code: string | null;
  name: string;
  latin_name: string | null;
  description: string | null;
  price_rub: number;
  attrs: Record<string, unknown>;
  is_visible: boolean;
  stock: number;
  sort_order: number;
  images: ProductImage[];
}

export type ProductDraft = Omit<Product, 'id'> & { id?: string };

export interface OrderItem {
  id: string;
  product_id: string | null;
  name_snapshot: string;
  price_rub_snapshot: number;
  qty: number;
}

export interface Order {
  id: string;
  number: string;
  status: string;
  payment_status: string | null;
  total_rub: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string | null;
  comment: string | null;
  yookassa_payment_id: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface SocialMap {
  telegram?: string | null;
  instagram?: string | null;
  pinterest?: string | null;
  youtube?: string | null;
  vk?: string | null;
}

export const api = {
  async login(email: string, password: string): Promise<Me> {
    const resp = await request<{ access_token: string; admin: Me }>(
      '/api/admin/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    );
    saveSession(resp.access_token, resp.admin);
    return resp.admin;
  },

  me: () => request<Me>('/api/admin/me'),

  listProducts: () => request<Product[]>('/api/admin/products'),
  getProduct: (id: string) => request<Product>(`/api/admin/products/${id}`),
  createProduct: (body: ProductDraft) =>
    request<Product>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateProduct: (id: string, body: Partial<ProductDraft>) =>
    request<Product>(`/api/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteProduct: (id: string) =>
    request<void>(`/api/admin/products/${id}`, { method: 'DELETE' }),

  listOrders: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<Order[]>(`/api/admin/orders${qs}`);
  },
  getOrder: (id: string) => request<Order>(`/api/admin/orders/${id}`),
  updateOrder: (id: string, body: { status?: string; payment_status?: string }) =>
    request<Order>(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  getSocial: () => request<SocialMap>('/api/admin/settings/social'),
  putSocial: (body: SocialMap) =>
    request<SocialMap>('/api/admin/settings/social', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};
