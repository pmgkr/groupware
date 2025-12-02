import type { RouteObject } from 'react-router';
import Expense from '@/pages/Expense';
//import Proposal from '@/pages/Expense/proposal';
import Register from '@/pages/Expense/register';
import ExpenseView from '@/pages/Expense/view';
import ProposalRegister from '@/components/features/proposal/ProposalRegister';
import ProposalList from '@/pages/Expense/Proposal/userProposalList';
import ProposalView from '@/pages/Expense/Proposal/userProposalView';

export const expenseRoutes: RouteObject = {
  path: 'expense', // 상위 Layout 기준 → /expense
  handle: {
    title: '일반 비용',
    nav: [
      { to: '/expense', label: '비용 내역', end: true },
      { to: '/expense/proposal', label: '지출 기안' },
    ],
  },
  children: [
    { index: true, element: <Expense /> },
    {
      path: 'proposal',
      element: <ProposalList />,
    },
    { path: 'proposal/view/:id', element: <ProposalView /> },
    { path: 'proposal/register', element: <ProposalRegister /> },
    {
      path: 'register',
      element: <Register mode="new" />,
      handle: {
        // hideNav 시 Layout에서 2차 메뉴 숨김처리
        hideNav: true,
        hideTitle: true,
      },
    },
    {
      path: 'edit/:expId',
      element: <Register mode="edit" />,
      handle: {
        // hideNav 시 Layout에서 2차 메뉴 숨김처리
        hideNav: true,
        hideTitle: true,
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
