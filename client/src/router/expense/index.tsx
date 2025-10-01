import type { RouteObject } from 'react-router';
import Expense from '@/pages/Expense';
import Proposal from '@/pages/Expense/proposal';

export const expenseRoutes: RouteObject = {
  path: 'expense', // 상위 Layout 기준 → /expense
  handle: {
    title: '비용 관리',
    nav: [
      { to: '/expense', label: '일반 비용', end: true },
      { to: '/expense/proposal', label: '지출 기안' },
    ],
  },
  children: [
    { index: true, element: <Expense /> },
    { path: 'proposal', element: <Proposal /> },
  ],
};
