import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export type AppAlertItem = {
  id: string;
  title?: string;
  message?: string;
  icon?: ReactNode;
  duration?: number;
  className?: string;
};

type AppAlertStackProps = {
  alerts: AppAlertItem[];
  onRemove: (id: string) => void;
};

export function AppAlertStack({ alerts, onRemove }: AppAlertStackProps) {
  useEffect(() => {
    // 각 alert의 duration이 끝나면 자동으로 제거
    alerts.forEach((alert) => {
      if (alert.duration) {
        const timer = setTimeout(() => onRemove(alert.id), alert.duration);
        return () => clearTimeout(timer);
      }
    });
  }, [alerts, onRemove]);

  return (
    <AnimatePresence>
      {alerts.map((alert) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cn('fixed top-8 left-1/2 z-[99] flex w-[380px] -translate-x-1/2 flex-col gap-3', alert.className)}>
          <Alert className="shadow-md">
            {alert.icon && alert.icon}
            {alert.title && <AlertTitle className="text-base font-semibold">{alert.title}</AlertTitle>}
            {alert.message && (
              <AlertDescription className="text-sm leading-[1.3] text-gray-700">
                <div dangerouslySetInnerHTML={{ __html: alert.message }} />
              </AlertDescription>
            )}
          </Alert>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
