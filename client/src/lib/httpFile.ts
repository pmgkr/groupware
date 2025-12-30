import { getToken } from '@/lib/tokenStore';

const API = (import.meta.env.VITE_API_ORIGIN ?? '').replace(/\/$/, '');

export async function httpFile(path: string, options: RequestInit = {}) {
  const token = getToken();

  const res = await fetch(`${API}/${path.replace(/^\/+/, '')}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(`File request failed (${res.status})`);
  }

  return res;
}
