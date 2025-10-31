import { useState, useCallback } from 'react';
import { type AppAlertItem } from '@/components/common/ui/AppAlert/AppAlert';
import { v4 as uuidv4 } from 'uuid';

export function useAppAlert() {
  const [alerts, setAlerts] = useState<AppAlertItem[]>([]);

  // 새 알림 추가
  const addAlert = useCallback((alert: Omit<AppAlertItem, 'id'>) => {
    const id = uuidv4();
    setAlerts((prev) => [...prev, { id, duration: 3000, ...alert }]);
    return id;
  }, []);

  // 개별 알림 제거
  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // 전체 제거
  const clearAlerts = useCallback(() => setAlerts([]), []);

  return {
    alerts,
    addAlert,
    removeAlert,
    clearAlerts,
  };
}
