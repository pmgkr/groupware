// src/components/common/app-ui/AppUIProvider.tsx
import { type ReactNode } from 'react';
import { AppAlertProvider } from '@/components/common/ui/AppAlert/AppAlert';
import { AppDialogProvider } from '@/components/common/ui/AppDialog/AppDialog';

export function AppUIProvider({ children }: { children: ReactNode }) {
  return (
    <AppAlertProvider>
      <AppDialogProvider>{children}</AppDialogProvider>
    </AppAlertProvider>
  );
}
