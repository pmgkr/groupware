// src/router/index.tsx
import { createBrowserRouter } from 'react-router';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import BoardList from '@/pages/board/BoardList';
import BoardDetail from '@/pages/board/BoardDetail';
import BoardWrite from '@/pages/board/BoardWrite';
import ErrorPage from '@/pages/ErrorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/board/list',
    element: <BoardList />,
  },
  {
    path: '/board/detail/:postId',
    element: <BoardDetail />,
  },
  {
    path: '/board/write',
    element: <BoardWrite />,
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
]);
