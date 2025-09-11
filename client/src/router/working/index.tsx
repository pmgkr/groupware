import type { RouteObject } from 'react-router';
import Working from '@/pages/Working/';

export const workingRoutes: RouteObject = {
  handle: {
    title: '출퇴근관리',
    nav: [{ to: '/working', label: '전체' }],
  },
  children: [{ path: 'working', element: <Working /> }],
};
