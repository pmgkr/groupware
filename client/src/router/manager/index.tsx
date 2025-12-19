import type { RouteObject } from 'react-router';
import Manager from '@/pages/Manager';
import Working from '@/pages/Manager/Working';
import Overtime from '@/pages/Manager/Overtime';
import Pexpense from '@/pages/Manager/Pexpense';
import Nexpense from '@/pages/Manager/Nexpense';
import ManagerProposalList from '@/pages/Manager/Proposal/managerProposalList';
import ManagerProposalView from '@/pages/Manager/Proposal/managerProposalView';

import PexpenseView from '@components/features/Project/ManagerExpenseView';
import NexpenseView from '@components/features/Expense/ManagerExpenseView';
import VacationLayout from '@/pages/Manager/Vacation/VacationLayout';
import VacationManage from '@/pages/Manager/Vacation/VacationManage';
import VacationHistory from '@/pages/Manager/Vacation/VacationHistory';
import VacationHistoryDetail from '@/pages/Manager/Vacation/VacationHistoryDetail';
import ManagerHistoryDetail from '@/pages/Manager/Vacation/VacationHistoryDetail';

export const managerRoutes: RouteObject = {
  path: 'manager',
  handle: {
    title: '관리자',
    nav: [
      // { to: '/manager', label: '대시보드', end: true },
      { to: '/manager/working', label: '근태 관리' },
      { to: '/manager/overtime', label: '추가근무 관리' },
      { to: '/manager/pexpense', label: '프로젝트 비용 관리' },
      { to: '/manager/nexpense', label: '일반 비용 관리' },
      { to: '/manager/vacation', label: '휴가 관리' },
      { to: '/manager/proposal', label: '기안서 관리' },
      { to: '/manager/member', label: '구성원 관리' },
    ],
  },
  children: [
    // { index: true, element: <Manager /> },
    { path: 'working', element: <Working /> },
    { path: 'overtime', element: <Overtime /> },
    { path: 'pexpense', element: <Pexpense /> },
    { path: 'pexpense/:expId', element: <PexpenseView /> },
    {
      path: 'nexpense',
      element: <Nexpense />,
    },
    { path: 'nexpense/:expId', element: <NexpenseView /> },
    {
      path: 'vacation',
      element: <VacationLayout />,
      children: [
        { index: true, element: <VacationManage /> },
        { path: 'history', element: <VacationHistory /> },
        { path: 'user/:id', element: <VacationHistoryDetail /> },
      ],
    },
    { path: 'proposal', element: <ManagerProposalList /> }, // 레이아웃 (index.tsx)
    { path: 'proposal/view/:id', element: <ManagerProposalView /> }, // 상세 + 승인/반려
  ],
};
