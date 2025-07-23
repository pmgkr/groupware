// src/router/index.tsx
import { createBrowserRouter } from 'react-router';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
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
    path: '*',
    element: <ErrorPage />,
  },
]);
