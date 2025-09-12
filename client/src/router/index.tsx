import { createBrowserRouter } from 'react-router';
import type { RouteObject } from 'react-router';
import { lazy, Suspense } from 'react';

// Lazy loading for layouts
const AuthLayout = lazy(() => import('@/layouts/AuthLayout'));
const PublicLayout = lazy(() => import('@/layouts/PublicLayout'));
const Layout = lazy(() => import('@/layouts/Layout'));

// Lazy loading for pages
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const ErrorPage = lazy(() => import('@/pages/ErrorPage'));

import { calendarRoutes } from './calendar';
import { workingRoutes } from './working';
import { officeRoutes } from './office';
import { mypageRoutes } from './mypage';
import { managerRoutes } from './manager';

// 인증 후 Layout 하위의 자식 라우트들
const authedChildren: RouteObject[] = [
  // 필요 순서대로
  calendarRoutes,
  workingRoutes,
  officeRoutes,
  mypageRoutes,
  managerRoutes,
];

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
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
            <Login />
          </Suspense>
        ) 
      },
      { 
        path: '/onboarding', 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Onboarding />
          </Suspense>
        ) 
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
        ) 
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
          // 루트로 접근시 대시보드로 보내고 싶다면 주석 해제
          // { index: true, element: <Navigate to="dashboard" replace /> },

          // 섹션별 라우트 합치기
          ...authedChildren,
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
    ) 
  },
]);
