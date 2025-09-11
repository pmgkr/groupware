import type { RouteObject } from 'react-router';
import Calendar from '@/pages/Calendar/';

export const calendarRoutes: RouteObject = {
  handle: {
    title: '캘린더',
    nav: [{ to: '/calendar', label: '전체', end: true }],
  },
  children: [{ path: 'calendar', element: <Calendar /> }],
};
