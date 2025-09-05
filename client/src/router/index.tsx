import { createBrowserRouter, Navigate } from 'react-router';
import Layout from '@/layouts/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';

// 캘린더 페이지
import Calendar from '@/pages/Calendar/';

// 출퇴근관리 페이지
import Working from '@/pages/Working/';

// 오피스 페이지
import Notice from '@/pages/Office/Notice';
import BoardWrite from '@/components/board/BoardWrite';
import BoardDetail from '@/components/board/BoardDetail';
import BoardList from '@/components/board/BoardList';
import Meetingroom from '@/pages/Office/Meetingroom';
import ItDevice from '@/pages/Office/ItDevice';
import Book from '@/pages/Office/Book';
import BookList from '@/components/book/BookList';
import BookWish from '@/components/book/BookWish';

// 마이페이지
import Mypage from '@/pages/Mypage';
import MyExpense from '@/pages/Mypage/Expense';

// 관리자 페이지
import Manager from '@/pages/Manager';

import ErrorPage from '@/pages/ErrorPage';

export const router = createBrowserRouter([
  {
    // 로그인은 레이아웃 없이 단독 라우트
    path: '/',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    // 레이아웃이 필요한 영역
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      // { index: true, element: <Navigate to="dashboard" replace /> }, // 로그인 후 '/'로 접근 시 /dashboard로 보내야함
      {
        handle: {
          title: '캘린더',
          nav: [
            {
              to: '/calendar',
              label: '전체',
              end: true, // end=true → 정확히 /mypage와 일치할 때에만 활성
            },
          ],
        },
        children: [
          {
            path: 'calendar',
            element: <Calendar />,
          },
        ],
      },
      {
        handle: {
          title: '출퇴근관리',

          nav: [
            {
              to: '/working',
              label: '전체',
            },
          ],
        },
        children: [
          {
            path: 'working',
            element: <Working />,
          },
        ],
      },
      {
        handle: {
          title: '오피스',
          nav: [
            {
              to: '/notice',
              label: '공지사항',
            },
            {
              to: '/meetingroom',
              label: '미팅룸',
            },
            {
              to: '/itdevice',
              label: 'IT디바이스',
            },
            {
              to: '/book',
              label: '도서',
            },
          ],
        },
        children: [
          {
            path: 'notice',
            element: <Notice />,
            children: [
              { index: true, element: <BoardList /> }, // /notice
              { path: 'write', element: <BoardWrite /> }, // /notice/write
              { path: ':id', element: <BoardDetail /> }, // /notice/:id
            ],
          },
          {
            path: 'meetingroom',
            element: <Meetingroom />,
          },
          {
            path: 'itdevice',
            element: <ItDevice />,
          },
          {
            path: 'book',
            element: <Book />,
            children: [
              { index: true, element: <BookList /> }, // /book/list
              { path: 'wish', element: <BookWish /> }, // /book/wish
              //{ path: ':id', element: <BookDetail /> }, // /book/wish
            ],
          },
        ],
      },
      {
        path: '/mypage',
        handle: {
          title: '마이페이지',
          nav: [
            {
              to: '/mypage',
              label: '내 프로필',
              end: true, // end=true → 정확히 /mypage와 일치할 때에만 활성
            },
            {
              to: '/mypage/expense',
              label: '내 비용관리',
            },
            {
              to: '/mypage/vacation',
              label: '휴가 내역',
            },
          ],
        },
        children: [
          {
            index: true,
            element: <Mypage />,
          },
          {
            path: 'expense',
            element: <MyExpense />,
          },
        ],
      },
      {
        path: '/manager',
        handle: {
          title: '관리자',
          nav: [
            {
              to: '/manager',
              label: '대시보드',
            },
            {
              to: '/manager/working',
              label: '근태 관리',
            },
            {
              to: '/manager/expense',
              label: '비용 관리',
            },
            {
              to: '/manager/vacation',
              label: '휴가 관리',
            },
            {
              to: '/manager/member',
              label: '구성원 관리',
            },
          ],
        },
        children: [
          {
            index: true,
            element: <Manager />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
]);
