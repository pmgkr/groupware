// src/components/common/app-ui/AppUIProvider.tsx
import { type ReactNode } from 'react';
import { AppAlertProvider } from '@/components/common/ui/AppAlert/AppAlert';
import { AppDialogProvider } from '@/components/common/ui/AppDialog/AppDialog';
import { LoadingProvider } from '@/components/common/ui/Loading/loading';

export function AppUIProvider({ children }: { children: ReactNode }) {
  return (
    <AppAlertProvider>
      <AppDialogProvider>
        <LoadingProvider>{children}</LoadingProvider>
      </AppDialogProvider>
    </AppAlertProvider>
  );
}
