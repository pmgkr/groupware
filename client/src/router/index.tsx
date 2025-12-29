import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import type { RouteObject } from 'react-router';
import { lazy, Suspense, type ReactElement } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Lazy loading for layouts
const AuthLayout = lazy(() => import('@/layouts/AuthLayout'));
const PublicLayout = lazy(() => import('@/layouts/PublicLayout'));
const Layout = lazy(() => import('@/layouts/Layout'));

// Lazy loading for pages
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const ErrorPage = lazy(() => import('@/pages/ErrorPage'));

// 로그인 상태면 대시보드로 리다이렉트, 아니면 로그인 페이지 표시
const PublicIndex = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.user_id) return <Navigate to="/dashboard" replace />;
  return <Login />;
};

import { projectRoutes } from './project';
import { expenseRoutes } from './expense';
import { calendarRoutes } from './calendar';
import { workingRoutes } from './working';
import { officeRoutes } from './office';
import { mypageRoutes } from './mypage';
import { managerRoutes } from './manager';
import { adminRoutes } from './admin';

// 권한별 리다이렉팅
const ManagerAuth = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  const level = user?.user_level;
  if (level === 'manager' || level === 'admin') return <Outlet />;
  return <Navigate to="/" replace />;
};

const AdminAuth = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.user_level === 'admin') return <Outlet />;
  return <Navigate to="/" replace />;
};

const withAuth = (route: RouteObject, AuthElement: ReactElement): RouteObject => ({
  path: route.path,
  id: route.id,
  caseSensitive: route.caseSensitive,
  loader: route.loader,
  action: route.action,
  shouldRevalidate: route.shouldRevalidate,
  handle: route.handle,
  element: AuthElement,
  errorElement: route.errorElement,
  children: route.children ?? [],
});

const AuthManagerRoutes: RouteObject = withAuth(managerRoutes, <ManagerAuth />);
const AuthAdminRoutes: RouteObject = withAuth(adminRoutes, <AdminAuth />);

// 인증 후 Layout 하위의 자식 라우트들
const AuthChildren: RouteObject[] = [
  // 필요 순서대로
  projectRoutes,
  expenseRoutes,
  calendarRoutes,
  workingRoutes,
  officeRoutes,
  mypageRoutes,
  AuthManagerRoutes,
  AuthAdminRoutes,
];

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-500"></div>
  </div>
);

export const router = createBrowserRouter([
  // 공개 구간
  {
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <PublicLayout />
      </Suspense>
    ),
    children: [
      {
        path: '/',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <PublicIndex />
          </Suspense>
        ),
      },
      {
        path: '/onboarding',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Onboarding />
          </Suspense>
        ),
      },
    ],
  },

  // 인증 구간
  {
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <AuthLayout />
      </Suspense>
    ),
    children: [
      {
        path: '/dashboard',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: '/',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Layout />
          </Suspense>
        ),
        errorElement: (
          <Suspense fallback={<LoadingSpinner />}>
            <ErrorPage />
          </Suspense>
        ),
        children: [
          // 섹션별 라우트 합치기
          ...AuthChildren,
        ],
      },
    ],
  },

  // 404
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <ErrorPage />
      </Suspense>
    ),
  },
]);
