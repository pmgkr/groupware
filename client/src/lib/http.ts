// src/lib/http.ts
import { setToken, getToken } from '@/lib/tokenStore';

async function refreshAccessToken() {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/refresh`, {
    method: 'POST',
    credentials: 'include', // 쿠키 전송
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  setToken(data.accessToken);
  return data.accessToken as string;
}

export async function http<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  let token = getToken();

  async function doFetch(withToken?: string) {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(withToken ? { Authorization: `Bearer ${withToken}` } : {}),
        ...(options?.headers || {}),
      },
      credentials: 'include',
      ...options,
    });
    return res;
  }

  let res = await doFetch(token);
  if (res.status === 401 && token) {
    // 액세스 만료 → 리프레시
    const newToken = await refreshAccessToken();
    res = await doFetch(newToken);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || '요청 실패');
  return data as T;
}
