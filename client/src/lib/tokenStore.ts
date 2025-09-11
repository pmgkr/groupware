// src/lib/tokenStore.ts
let _token: string | undefined;

export function setToken(token?: string) {
  _token = token;
}

export function getToken() {
  return _token;
}
