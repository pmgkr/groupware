import type { RouteObject } from 'react-router';
import Dashboard from '@/pages/Admin';

import FinanceLayout from '@/pages/Admin/Finance/FinanceLayout';
import Pexpense from '@/pages/Admin/Finance/Pexpense';
import PexpenseView from '@components/features/Project/AdminExpenseView';
import Nexpense from '@/pages/Admin/Finance/Nexpense';
import NexpenseView from '@components/features/Expense/AdminExpenseView';
import Invoice from '@/pages/Admin/Finance/Invoice';

import Vacation from '@/pages/Admin/Vacation';
import VacationDetail from '@/pages/Admin/VacationDetail';
import AdminWorking from '@/pages/Admin/Working';
import AdminOvertime from '@/pages/Admin/Overtime';
import AdminProposalList from '@/pages/Admin/Proposal/adminProposalList';
import AdminProposalView from '@/pages/Admin/Proposal/adminProposalView';
import Member from '@/pages/Admin/Member';

export const adminRoutes: RouteObject = {
  path: 'admin', // → /Admin
  handle: {
    title: '최고관리자',
    nav: [
      // { to: '/admin', label: '대시보드', end: true },
      { to: '/admin/finance', label: '파이낸스' },
      { to: '/admin/working', label: '근태 관리' },
      { to: '/admin/overtime', label: '추가근무 관리' },
      { to: '/admin/vacation', label: '휴가 관리' },
      { to: '/admin/proposal', label: '기안서 관리' },
      { to: '/admin/member', label: '구성원 관리' },
    ],
  },
  children: [
    // { index: true, element: <Dashboard /> },
    {
      path: 'finance',
      element: <FinanceLayout />,
      children: [
        { index: true, element: <Pexpense /> },
        { path: 'pexpense/:expId', element: <PexpenseView /> },

        { path: 'nexpense', element: <Nexpense /> },
        { path: 'nexpense/:expId', element: <NexpenseView /> },

        { path: 'invoice', element: <Invoice /> },
      ],
    },
    { path: 'vacation', element: <Vacation /> },
    { path: 'vacation/user/:id', element: <VacationDetail /> },
    { path: 'working', element: <AdminWorking /> },
    { path: 'overtime', element: <AdminOvertime /> },
    { path: 'proposal', element: <AdminProposalList /> },
    { path: 'proposal/:id', element: <AdminProposalView /> },
    { path: 'member', element: <Member /> },
  ],
};
