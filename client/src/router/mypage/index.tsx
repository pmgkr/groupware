import type { RouteObject } from 'react-router';
import Mypage from '@/pages/Mypage';
import MyExpense from '@/pages/Mypage/Expense';

export const mypageRoutes: RouteObject = {
  path: 'mypage', // 상위 Layout 기준 → /mypage
  handle: {
    title: '마이페이지',
    nav: [
      { to: '/mypage', label: '내 프로필', end: true },
      { to: '/mypage/expense', label: '내 비용관리' },
      { to: '/mypage/vacation', label: '휴가 내역' },
    ],
  },
  children: [
    { index: true, element: <Mypage /> },
    { path: 'expense', element: <MyExpense /> },
  ],
};
