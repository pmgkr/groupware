// src/lib/http.ts
import { setToken, getToken } from '@/lib/tokenStore';

const API = (import.meta.env.VITE_API_ORIGIN ?? '').replace(/\/$/, '');

// 요청 body가 FormData인지 확인 (FormData일 경우엔 Content-Type을 설정하지 않게끔)
function isFormData(body: any): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

// API 요청 실패 시 커스텀 에러 클래스 (status는 HTTP 상태 코드, 에러 메시지는 data.message 없으면 res.statusText.)
export class HttpError extends Error {
  status: number;
  data?: any;
  constructor(res: Response, data?: any) {
    super((data && data.message) || res.statusText);
    this.status = res.status;
    this.data = data;
  }
}

// 리프레시 토큰을 헤더로 전송해서 새로운 Access Token을 발급
// 성공 시 tokenStore에 setToken으로 새 토큰 저장
import { getRefreshToken, setRefreshToken } from './refreshTokenStore';

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) { throw new Error('Refresh token missing');}

  const res = await fetch(`${API}/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Refresh-Token': refreshToken,
    },
    credentials: 'include',
  });
  if (!res.ok) {
    // refresh token이 유효하지 않으면 삭제
    if (res.status === 401 || res.status === 403) {
      setRefreshToken(undefined);
    }
    throw new Error('Refresh failed');
  }
  const data = await res.json();
  setToken(data.accessToken);
  // 새로운 refresh token이 있으면 저장
  if (data.refreshToken) {
    setRefreshToken(data.refreshToken);
  }
  return data.accessToken as string;
}

{
  /* API 호출 핵심 함수 */
}
// API 경로(path)와 fetch 옵션(options)을 받아서 실제 API 호출 수행
// 토큰이 만료된 경우 refreshAccessToken()으로 토큰 갱신 시도 후 재요청
// T는 제네릭(Generic) 타입 파라미터. 서버에서 내려온 데이터의 타입을 지정하기 위한 용도
export async function http<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const toUrl = (p: string) => `${API}/${p.replace(/^\/+/, '')}`;
  let token = getToken();

  // 요청 헤더 빌드
  const buildHeaders = (withToken?: string) => {
    const userHeaders = (options.headers as Record<string, string>) || {};
    const hasCT = Object.keys(userHeaders).some((k) => k.toLowerCase() === 'content-type');
    return {
      ...(withToken ? { Authorization: `Bearer ${withToken}` } : {}),
      ...(!hasCT && !isFormData(options.body) ? { 'Content-Type': 'application/json' } : {}),
      ...userHeaders,
    };
  };

  // 실제 fetch 실행
  async function doFetch(withToken?: string) {
    return fetch(toUrl(path), {
      credentials: 'include',
      ...options,
      headers: buildHeaders(withToken),
    });
  }

  // 토큰 만료 시 새 토큰 갱신 후 재요청
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

  // API 응답 처리
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(res, data);
  return data as T;
}
