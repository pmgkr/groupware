import type { RouteObject } from 'react-router';
import Expense from '@/pages/Expense';
import Proposal from '@/pages/Expense/proposal';
import Register from '@/pages/Expense/register';
import ExpenseView from '@/pages/Expense/view';

export const expenseRoutes: RouteObject = {
  path: 'expense', // 상위 Layout 기준 → /expense
  handle: {
    title: '비용 관리',
    nav: [
      { to: '/expense', label: '비용 내역', end: true },
      { to: '/expense/proposal', label: '지출 기안' },
    ],
  },
  children: [
    { index: true, element: <Expense /> },
    { path: 'proposal', element: <Proposal /> },
    {
      path: 'register',
      element: <Register />,
      handle: {
        // hideNav 시 Layout에서 2차 메뉴 숨김처리
        hideNav: true,
      },
    },
    {
      path: ':expId',
      element: <ExpenseView />,
      handle: {
        // hideNav 시 Layout에서 2차 메뉴 숨김처리
        hideNav: true,
        hideTitle: true,
      },
    },
  ],
};
