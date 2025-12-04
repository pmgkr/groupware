import type { RouteObject } from 'react-router';
import Dashboard from '@/pages/Admin';
import Vacation from '@/pages/Admin/Vacation';
import VacationDetail from '@/pages/Admin/VacationDetail';

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
    { path: 'vacation/user/:id', element: <VacationDetail /> },
  ],
};


