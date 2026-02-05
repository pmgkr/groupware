import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { UserDTO } from '@/api/auth';
import { getUser, logoutApi } from '@/api/auth';
import { refreshAccessToken } from '@/lib/http';
import { setToken as setTokenStore } from '@/lib/tokenStore';

const LOGOUT_FLAG = 'auth:logged_out';

// AuthContext에서 제공할 값의 타입
type AuthValue = {
  user: UserDTO | null;
  loading: boolean;
  logout: () => Promise<void>;
  setUserState: React.Dispatch<React.SetStateAction<UserDTO | null>>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authLoading = async () => {
      // 로그아웃 후 세션 유지 중에는 자동 재인증을 막음
      if (sessionStorage.getItem(LOGOUT_FLAG) === 'true') {
        setLoading(false);
        return;
      }

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
    // 로그아웃 플래그 설정 (세션 범위)
    sessionStorage.setItem(LOGOUT_FLAG, 'true');
  };

  const value = useMemo<AuthValue>(
    () => ({ user, loading, logout, setUserState: setUser }),
    [user, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
