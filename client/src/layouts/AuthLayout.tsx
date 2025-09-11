// src/layouts/AuthLayout.tsx
import { Navigate, Outlet, useLocation } from 'react-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

/**
 * AuthLayout은 인증이 필요한 라우트 전용 레이아웃
 * - 내부에서만 AuthProvider를 감쌈
 * - 로그인된 사용자만 접근 가능
 */
function AuthGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <span className="animate-pulse text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default function AuthLayout() {
  return (
    <AuthProvider>
      <AuthGuard />
    </AuthProvider>
  );
}
