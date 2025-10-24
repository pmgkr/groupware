import type { RouteObject } from 'react-router';
import Calendar from '@/pages/Calendar/';

export const calendarRoutes: RouteObject = {
  handle: {
    title: '캘린더',
    nav: [
      { to: '/calendar', label: '전체', end: true },
      { to: '/calendar/my', label: '내 일정', end: true }
    ],
  },
  children: [
    { path: 'calendar', element: <Calendar /> },
    { path: 'calendar/my', element: <Calendar filterMyEvents={true} /> }
  ],
};
