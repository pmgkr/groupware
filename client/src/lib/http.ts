// src/lib/http.ts
import { setToken, getToken } from '@/lib/tokenStore';

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
  const res = await fetch(`/api/refresh`, {
    method: 'POST',
    credentials: 'include', // 쿠키 전송
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  setToken(data.accessToken);
  return data.accessToken as string;
}

export async function http<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  let token = getToken();

  const buildHeaders = (withToken?: string) => {
    const base: Record<string, string> = {
      ...(withToken ? { Authorization: `Bearer ${withToken}` } : {}),
    };
    // body가 FormData가 아니고, 사용자가 Content-Type을 직접 지정하지 않았을 때만 JSON 기본값
    const userHeaders = (options.headers as Record<string, string>) || {};
    const hasCT = Object.keys(userHeaders || {}).some((k) => k.toLowerCase() === 'content-type');
    if (!hasCT && !isFormData(options.body)) {
      base['Content-Type'] = 'application/json';
    }
    return { ...base, ...userHeaders };
  };

  async function doFetch(withToken?: string) {
    return fetch(`/api/${path.replace(/^\/+/, '')}`, {
      credentials: 'include',
      ...options,
      headers: buildHeaders(withToken),
    });
  }

  let res = await doFetch(token);
  if (res.status === 401 && token) {
    // 액세스 만료 → 리프레시
    const newToken = await refreshAccessToken();
    res = await doFetch(newToken);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new HttpError(res, data); // 💡 HttpError 객체를 던지도록 수정
  }
  return data as T;
}
