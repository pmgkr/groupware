// src/lib/http.ts
import { setToken, getToken } from '@/lib/tokenStore';

const API = (import.meta.env.VITE_API_ORIGIN ?? '').replace(/\/$/, '');

function isFormData(body: any): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

export class HttpError extends Error {
  status: number;
  data?: any;
  constructor(res: Response, data?: any) {
    super((data && data.message) || res.statusText);
    this.status = res.status;
    this.data = data;
  }
}

export async function refreshAccessToken() {
  const res = await fetch(`${API}/refresh`, {
    method: 'POST',
    credentials: 'include', // 쿠키 전송(백엔드 도메인으로)
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  setToken(data.accessToken);
  return data.accessToken as string;
}

export async function http<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const toUrl = (p: string) => `${API}/${p.replace(/^\/+/, '')}`;
  let token = getToken();

  const buildHeaders = (withToken?: string) => {
    const userHeaders = (options.headers as Record<string, string>) || {};
    const hasCT = Object.keys(userHeaders).some((k) => k.toLowerCase() === 'content-type');
    return {
      ...(withToken ? { Authorization: `Bearer ${withToken}` } : {}),
      ...(!hasCT && !isFormData(options.body) ? { 'Content-Type': 'application/json' } : {}),
      ...userHeaders,
    };
  };

  async function doFetch(withToken?: string) {
    return fetch(toUrl(path), {
      credentials: 'include',
      ...options,
      headers: buildHeaders(withToken),
    });
  }

  let res = await doFetch(token);
  if (res.status === 401 && token) {
    try {
      const newToken = await refreshAccessToken();
      res = await doFetch(newToken);
    } catch {
      setToken(undefined);
      throw new HttpError(res, { message: 'Unauthorized' });
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(res, data);
  return data as T;
}
