import { createBrowserRouter, Navigate } from 'react-router';
import Layout from '@/layouts/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';

import Notice from '@/pages/Office/Notice';
import BoardWrite from '@/components/board/BoardWrite';
import BoardDetail from '@/components/board/BoardDetail';
import BoardList from '@/components/board/BoardList';

import Meetingroom from '@/pages/Office/Meetingroom';

import Mypage from '@/pages/Mypage';
import MyExpense from '@/pages/Mypage/Expense';
import ErrorPage from '@/pages/ErrorPage';

export const router = createBrowserRouter([
  {
    // 로그인은 레이아웃 없이 단독 라우트
    path: '/',
    element: <Login />,
  },
  {
    // 레이아웃이 필요한 영역
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> }, // '/'로 접근 시 /dashboard로 보냄
      { path: '/dashboard', element: <Dashboard /> },
      {
        handle: {
          title: '오피스',
          nav: [
            {
              to: '/notice',
              label: '공지사항',
              end: true, // end=true → 정확히 /mypage와 일치할 때에만 활성
            },
            {
              to: '/meetingroom',
              label: '미팅룸',
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
    ],
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
]);
