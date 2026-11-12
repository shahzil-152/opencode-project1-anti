import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { notificationApi } from '@/services/notificationApi';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return 0;
    }
    try {
      const count = await notificationApi.unreadCount();
      setUnreadCount(count);
      return count;
    } catch {
      return 0;
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return undefined;
    }
    refresh();
    // Light polling keeps the badge current without websockets.
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, [user, refresh]);

  const value = useMemo(() => ({ unreadCount, refresh }), [unreadCount, refresh]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
