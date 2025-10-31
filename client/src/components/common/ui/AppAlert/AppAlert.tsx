// src/components/common/AppAlert/AppAlert.tsx
import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

export type AppAlertItem = {
  id: string;
  title?: string;
  message?: string;
  icon?: ReactNode;
  duration?: number;
  className?: string;
};

type AppAlertContextValue = {
  addAlert: (alert: Omit<AppAlertItem, 'id'>) => void;
};

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export function useAppAlert() {
  const ctx = useContext(AppAlertContext);
  if (!ctx) throw new Error('useAppAlert must be used within AppAlertProvider');
  return ctx;
}

export function AppAlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AppAlertItem[]>([]);

  const addAlert = useCallback((alert: Omit<AppAlertItem, 'id'>) => {
    const id = uuidv4();
    setAlerts((prev) => [...prev, { ...alert, id }]);
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ⏱️ duration이 끝나면 자동 제거
  useEffect(() => {
    const timers = alerts.map((alert) => {
      if (alert.duration) {
        const timer = setTimeout(() => removeAlert(alert.id), alert.duration);
        return () => clearTimeout(timer);
      }
      return () => {};
    });
    return () => timers.forEach((clear) => clear());
  }, [alerts, removeAlert]);

  return (
    <AppAlertContext.Provider value={{ addAlert }}>
      {children}

      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn('fixed top-8 left-1/2 z-[99] flex w-[380px] -translate-x-1/2 flex-col gap-3', alert.className)}>
            <Alert className="text-base shadow-md">
              {alert.icon && alert.icon}
              {alert.title && <AlertTitle className="font-semibold" dangerouslySetInnerHTML={{ __html: alert.title }}></AlertTitle>}
              {alert.message && (
                <AlertDescription
                  className="text-[.9em] leading-[1.3] text-gray-700"
                  dangerouslySetInnerHTML={{ __html: alert.message }}></AlertDescription>
              )}
            </Alert>
          </motion.div>
        ))}
      </AnimatePresence>
    </AppAlertContext.Provider>
  );
}
