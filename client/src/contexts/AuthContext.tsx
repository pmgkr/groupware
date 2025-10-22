import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { UserDTO } from '@/api/auth';
import { getUser, logoutApi } from '@/api/auth';
import { refreshAccessToken } from '@/lib/http';
import { setToken as setTokenStore } from '@/lib/tokenStore';

// AuthContext에서 제공할 값의 타입
type AuthValue = {
  user: UserDTO | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authLoading = async () => {
      try {
        await refreshAccessToken(); // 쿠키 있으면 access 발급, 없으면 throw
        const me = await getUser(); // access가 생겼으니 /user 호출

        setUser(me);
      } catch {
        // 로그인 전/쿠키 없음/검증 실패 → user는 null 유지
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    authLoading();
  }, []);

  const logout = async () => {
    try {
      await logoutApi();
    } catch {}
    setUser(null);
    setTokenStore(undefined);
  };

  const value = useMemo<AuthValue>(() => ({ user, loading, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
