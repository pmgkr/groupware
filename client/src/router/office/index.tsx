import type { RouteObject } from 'react-router';
import Notice from '@/pages/Office/Notice';
import BoardWrite from '@/components/board/BoardWrite';
import BoardDetail from '@/components/board/BoardDetail';
import BoardList from '@/components/board/BoardList';
import Meetingroom from '@/pages/Office/Meetingroom';
import ItDevice from '@/pages/Office/ItDevice';
import ItDeviceDetail from '@/components/itdevice/ItDeviceDetail';
import Book from '@/pages/Office/Book';
import BookList from '@/components/book/BookList';
import BookWish from '@/components/book/BookWish';
import SuggestBoard from '@/pages/Office/SuggestBoard';
import BoardLayout from '@/pages/Office/Notice';

export const officeRoutes: RouteObject = {
  handle: {
    title: '오피스',
    nav: [
      { to: '/notice', label: '공지사항' },
      { to: '/meetingroom', label: '미팅룸' },
      { to: '/itdevice', label: 'IT디바이스' },
      { to: '/book', label: '도서' },
      { to: '/suggest', label: '제보게시판' },
    ],
  },
  children: [
    {
      path: 'notice',
      element: <Notice />,
      children: [
        { index: true, element: <BoardList /> },
        { path: 'write', element: <BoardWrite /> },
        { path: ':id', element: <BoardDetail /> },
      ],
    },
    { path: 'meetingroom', element: <Meetingroom /> },
    { path: 'itdevice', element: <ItDevice /> },
    {
      path: 'itdevice/:id',
      element: <ItDeviceDetail />,
    },
    {
      path: 'book',
      element: <Book />,
      children: [
        { index: true, element: <BookList /> }, // /book
        { path: 'wish', element: <BookWish /> }, // /book/wish
      ],
    },
    {
      path: 'suggest',
      element: <SuggestBoard />,
      children: [
        { index: true, element: <BoardList /> },
        { path: 'write', element: <BoardWrite /> },
        { path: ':id', element: <BoardDetail /> },
      ],
    },
  ],
};
