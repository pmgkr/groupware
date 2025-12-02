import type { RouteObject } from 'react-router';
import Manager from '@/pages/Manager';
import Working from '@/pages/Manager/Working';
import Overtime from '@/pages/Manager/Overtime';
import Vacation from '@/pages/Manager/Vacation';
import ManagerProposalList from '@/pages/Manager/Proposal/managerProposalList';
import ManagerProposalView from '@/pages/Manager/Proposal/managerProposalView';

export const managerRoutes: RouteObject = {
  path: 'manager', // → /manager
  handle: {
    title: '관리자',
    nav: [
      { to: '/manager', label: '대시보드', end: true },
      { to: '/manager/working', label: '근태 관리' },
      { to: '/manager/vacation', label: '휴가 관리' },
      { to: '/manager/overtime', label: '추가근무 관리' },
      { to: '/manager/expense', label: '비용 관리' },
      { to: '/manager/member', label: '구성원 관리' },
      { to: '/manager/proposal', label: '기안서 관리' },
    ],
  },
  children: [
    { index: true, element: <Manager /> },
    { path: 'working', element: <Working /> },
    { path: 'vacation', element: <Vacation /> },
    { path: 'overtime', element: <Overtime /> },
    { path: 'proposal', element: <ManagerProposalList /> }, // 레이아웃 (index.tsx)
    { path: 'proposal/view/:id', element: <ManagerProposalView /> }, // 상세 + 승인/반려
  ],
};
