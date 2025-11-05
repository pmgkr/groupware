import type { RouteObject } from 'react-router';
import Manager from '@/pages/Manager';
import Working from '@/pages/Manager/working';

export const managerRoutes: RouteObject = {
  path: 'manager', // → /manager
  handle: {
    title: '관리자',
    nav: [
      { to: '/manager', label: '대시보드' },
      { to: '/manager/working', label: '근태 관리' },
      { to: '/manager/expense', label: '비용 관리' },
      { to: '/manager/vacation', label: '휴가 관리' },
      { to: '/manager/member', label: '구성원 관리' },
    ],
  },
  children: [{ index: true, element: <Manager /> },
    { path: 'working', element: <Working /> },
  ],
};
