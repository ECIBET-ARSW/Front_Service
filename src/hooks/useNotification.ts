// Notification/toast hook.
// Provides a simple queue of in-app notifications (success, error, info, warning).
// Each notification auto-dismisses after `duration` ms.
import { useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

export function useNotification(duration = 4000) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const notify = useCallback((message: string, type: NotificationType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss, duration]);

  return {
    notifications,
    notify,
    dismiss,
    success: (msg: string) => notify(msg, 'success'),
    error:   (msg: string) => notify(msg, 'error'),
    info:    (msg: string) => notify(msg, 'info'),
    warning: (msg: string) => notify(msg, 'warning'),
  };
}
