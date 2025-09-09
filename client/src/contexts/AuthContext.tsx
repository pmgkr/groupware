// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { LoginPayload, UserDTO } from '@/api/auth';
import { loginApi, getUser, logoutApi } from '@/api/auth';
import { setToken as setTokenStore } from '@/lib/tokenStore';

type AuthValue = {
  user: UserDTO | null;
  loading: boolean;
  login: (payload: LoginPayload, opts?: { rememberEmail?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);
const LS_KEY_REMEMBER_EMAIL = 'remember_email'; // LocalStorage 이메일 기억하기 key

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (payload: LoginPayload, opts?: { rememberEmail?: boolean }) => {
    setLoading(true);

    const res = await loginApi(payload); // 서버 검증 + users row 포함 응답

    if (res.accessToken) setTokenStore(res.accessToken);

    // 로그인 성공 후 사용자 정보 하이드레이션
    const me = await getUser();
    setUser(me.user);

    // 이메일 기억하기
    if (opts?.rememberEmail) localStorage.setItem(LS_KEY_REMEMBER_EMAIL, payload.user_id);
    else localStorage.removeItem(LS_KEY_REMEMBER_EMAIL);
  };

  const logout = async () => {
    try {
      await logoutApi(); // 서버에서 refresh_token 쿠키 제거
    } catch {}
    setUser(null);
    setTokenStore(undefined);
  };

  const value = useMemo<AuthValue>(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export const AuthStorageKeys = {
  REMEMBER_EMAIL: LS_KEY_REMEMBER_EMAIL,
};
