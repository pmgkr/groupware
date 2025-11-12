import type { RouteObject } from 'react-router';
import Project from '@/pages/Project/ProjectList';

export const projectRoutes: RouteObject = {
  path: 'project', // 상위 Layout 기준 → /project
  handle: {
    title: '프로젝트',
    nav: [{ to: '/project', label: '프로젝트 관리', end: true }],
  },
  children: [{ index: true, element: <Project /> }],
};
