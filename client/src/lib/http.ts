// src/lib/http.ts
export async function http<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const base = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    credentials: 'include',
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || '요청에 실패했습니다.';
    throw new Error(msg);
  }
  return data as T;
}
