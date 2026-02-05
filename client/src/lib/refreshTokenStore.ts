// src/lib/refreshTokenStore.ts
const REFRESH_TOKEN_KEY = 'refresh_token';

export function setRefreshToken(token?: string) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function getRefreshToken(): string | undefined {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || undefined;
}

