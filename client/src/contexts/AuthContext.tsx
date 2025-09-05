// client/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type User = { id: string; name?: string; team?: number } | null;

type AuthContextType = {
  user: User;
  token?: string;
  login: (user: User, token?: string) => void;
  logout: () => void;
  isAuthed: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | undefined>();

  useEffect(() => {
    const saved = localStorage.getItem('auth');
    if (saved) {
      const { user, token } = JSON.parse(saved);
      setUser(user);
      setToken(token);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthed: !!user,
      login: (u: User, t?: string) => {
        setUser(u);
        setToken(t);
        localStorage.setItem('auth', JSON.stringify({ user: u, token: t }));
      },
      logout: () => {
        setUser(null);
        setToken(undefined);
        localStorage.removeItem('auth');
      },
    }),
    [user, token]
  );

  // 컨텍스트 생성자로 데이터 제공
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 컨텐스트  사용으로 데이터 얻기
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
