import { createBrowserRouter } from 'react-router';
import type { RouteObject } from 'react-router';

import AuthLayout from '@/layouts/AuthLayout';
import PublicLayout from '@/layouts/PublicLayout';
import Layout from '@/layouts/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Onboarding from '@/pages/Onboarding';
import ErrorPage from '@/pages/ErrorPage';

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

export const router = createBrowserRouter([
  // 공개 구간
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Login /> },
      { path: '/onboarding', element: <Onboarding /> },
    ],
  },

  // 인증 구간
  {
    element: <AuthLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      {
        path: '/',
        element: <Layout />,
        errorElement: <ErrorPage />,
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
  { path: '*', element: <ErrorPage /> },
]);
