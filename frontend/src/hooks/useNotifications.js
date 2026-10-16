import { useCallback } from "react";
import { notificationService } from "../services/notificationService";
import { useNotificationStore } from "../store/notificationStore";

export function useNotifications() {
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const lastReceived = useNotificationStore((state) => state.lastReceived);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  const refreshUnreadCount = useCallback(async () => {
    const count = await notificationService.unreadCount();
    setUnreadCount(count);
    return count;
  }, [setUnreadCount]);

  const markRead = useCallback(
    async (id) => {
      const result = await notificationService.markRead(id);
      setUnreadCount(result.unreadCount);
      return result.notification;
    },
    [setUnreadCount],
  );

  const markAllRead = useCallback(async () => {
    const result = await notificationService.markAllRead();
    setUnreadCount(result.unreadCount);
    return result;
  }, [setUnreadCount]);

  const remove = useCallback(
    async (id) => {
      const result = await notificationService.remove(id);
      setUnreadCount(result.unreadCount);
      return result;
    },
    [setUnreadCount],
  );

  return {
    unreadCount,
    lastReceived,
    refreshUnreadCount,
    markRead,
    markAllRead,
    remove,
  };
}
