import type { RouteObject } from 'react-router';
import Dashboard from '@/pages/Admin';
import Vacation from '@/pages/Admin/Vacation';
import VacationDetail from '@/pages/Admin/VacationDetail';
import AdminWorking from '@/pages/Admin/Working';
import AdminOvertime from '@/pages/Admin/Overtime';
import AdminProposalList from '@/pages/Admin/Proposal/adminProposalList';
import AdminProposalView from '@/pages/Admin/Proposal/adminProposalView';

export const adminRoutes: RouteObject = {
  path: 'Admin', // → /Admin
  handle: {
    title: '최고관리자',
    nav: [
      { to: '/admin', label: '대시보드', end: true },
      { to: '/admin/working', label: '근태 관리' },
      { to: '/admin/vacation', label: '휴가 관리' },
      { to: '/admin/overtime', label: '추가근무 관리' },
      { to: '/admin/proposal', label: '기안서 관리' },
    ],
  },
  children: [
    { index: true, element: <Dashboard /> },
    { path: 'vacation', element: <Vacation /> },
    { path: 'vacation/user/:id', element: <VacationDetail /> },
    { path: 'working', element: <AdminWorking /> },
    { path: 'overtime', element: <AdminOvertime /> },
    { path: 'proposal', element: <AdminProposalList /> },
    { path: 'proposal/:id', element: <AdminProposalView /> },
  ],
};
