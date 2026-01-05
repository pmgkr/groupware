// src/Main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AppUIProvider } from '@/components/common/ui/AppUIProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { router } from './router';
import '@/index.css';

const isProd = import.meta.env.PROD;

const App = (
  <AppUIProvider>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </AppUIProvider>
);

createRoot(document.getElementById('root')!).render(isProd ? App : <React.StrictMode>{App}</React.StrictMode>);
