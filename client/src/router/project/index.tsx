import type { RouteObject } from 'react-router';
import List from '@components/features/Project/ProjectList';
import ProjectLayout from '@/pages/Project/ProjectLayout';
import ProjectOverview from '@components/features/Project/ProjectOverview';
import ProjectExpense from '@/components/features/Project/ProjectExpense';
import ProjectExpenseView from '@/components/features/Project/ProjectExpenseView';
import ProjectExpenseRegister from '@/components/features/Project/ProjectExpenseRegister';

export const projectRoutes: RouteObject = {
  path: 'project', // 상위 Layout 기준 → /project
  handle: {
    title: '프로젝트',
    nav: [{ to: '/project', label: '프로젝트 관리', end: true }],
  },
  children: [
    // 프로젝트 리스트
    { index: true, element: <List /> },
    {
      path: ':projectId',
      element: <ProjectLayout />,
      children: [
        { index: true, element: <ProjectOverview />, handle: { hideNav: true, hideTitle: true } },
        { path: 'expense', element: <ProjectExpense />, handle: { hideNav: true, hideTitle: true } },
        {
          path: 'expense/:expId',
          element: <ProjectExpenseView />,
          handle: { hideNav: true, hideTitle: true },
        },
        { path: 'expense/register', element: <ProjectExpenseRegister />, handle: { hideNav: true, hideTitle: true } },
      ],
    },
  ],
};
