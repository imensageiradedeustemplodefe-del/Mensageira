"use client";

import { useNotifications } from "@/contexts/NotificationContext";

export const useNotificationCount = () => {
  const { unreadCount, loading } = useNotifications();
  return { count: unreadCount, isLoading: loading };
};
