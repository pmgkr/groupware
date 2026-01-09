import type { RouteObject } from 'react-router';
import Mypage from '@/pages/Mypage';
import MyExpense from '@/pages/Mypage/Expense';
import Vacation from '@/pages/Mypage/Vacation';
import Overtime from '@/pages/Mypage/Overtime';
import Invoice from '@/pages/Mypage/Invoice';

export const mypageRoutes: RouteObject = {
  path: 'mypage', // 상위 Layout 기준 → /mypage
  handle: {
    title: '마이페이지',
    nav: [
      { to: '/mypage', label: '내 프로필', end: true },
      { to: '/mypage/vacation', label: '휴가 내역' },
      { to: '/mypage/overtime', label: '연장근무 내역' },
      { to: '/mypage/expense', label: '내 비용 내역' },
      { to: '/mypage/invoice', label: '내 인보이스' },
    ],
  },
  children: [
    { index: true, element: <Mypage /> },
    { path: 'vacation', element: <Vacation /> },
    { path: 'overtime', element: <Overtime /> },
    { path: 'expense', element: <MyExpense /> },
    { path: 'invoice', element: <Invoice /> },
  ],
};
