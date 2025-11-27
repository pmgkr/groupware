import type { RouteObject } from 'react-router';
import List from '@components/features/Project/ProjectList';
import ProjectLayout from '@/pages/Project/ProjectLayout';
import ProjectOverview from '@components/features/Project/ProjectOverview';
import ProjectExpense from '@/components/features/Project/ProjectExpense';
import ProjectExpenseView from '@/components/features/Project/ProjectExpenseView';
import ProjectExpenseRegister from '@/components/features/Project/ProjectExpenseRegister';
import ProjectExpenseMatch from '@/components/features/Project/ProjectExpenseMatch';
import ProjectEstimate from '@/components/features/Project/ProjectEstimate';
import EstimatePreview from '@/components/features/Project/EstimatePreview';
import EstimateView from '@/components/features/Project/EstimateView';
import EstimateEdit from '@/components/features/Project/EstimateEdit';

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
        { path: 'expense/match', element: <ProjectExpenseMatch />, handle: { hideNav: true, hideTitle: true } },
        { path: 'estimate', element: <ProjectEstimate />, handle: { hideNav: true, hideTitle: true } },
        { path: 'estimate/preview', element: <EstimatePreview />, handle: { hideNav: true, hideTitle: true } },
        { path: 'estimate/:estId', element: <EstimateView />, handle: { hideNav: true, hideTitle: true } },
        { path: 'estimate/:estId/edit', element: <EstimateEdit />, handle: { hideNav: true, hideTitle: true } },
      ],
    },
  ],
};
