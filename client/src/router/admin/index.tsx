import type { RouteObject } from 'react-router';
import Dashboard from '@/pages/Admin';
import Vacation from '@/pages/Admin/Vacation';

export const adminRoutes: RouteObject = {
  path: 'Admin', // → /Admin
  handle: {
    title: '최고관리자',
    nav: [
      { to: '/admin', label: '대시보드', end: true },
      { to: '/admin/vacation', label: '휴가 관리' },
    ],
  },
  children: [
    { index: true, element: <Dashboard /> },
    { path: 'vacation', element: <Vacation /> },
  ],
};


