import type { RouteObject } from 'react-router';
import List from '@/pages/Project/ProjectList';
import ProjectOverview from '@/pages/Project/Project';

export const projectRoutes: RouteObject = {
  path: 'project', // 상위 Layout 기준 → /project
  handle: {
    title: '프로젝트',
    nav: [{ to: '/project', label: '프로젝트 관리', end: true }],
  },
  children: [
    { index: true, element: <List /> },
    {
      path: ':projectId',
      element: <ProjectOverview />,
      handle: {
        // hideNav 시 Layout에서 2차 메뉴 숨김처리
        hideNav: true,
        hideTitle: true,
      },
    },
  ],
};
