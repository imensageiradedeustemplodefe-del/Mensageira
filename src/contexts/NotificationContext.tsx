"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { api } from "@/lib/fetcher";
import type { InAppNotification } from "@/types/notifications";

const STORAGE_KEY = "read_notifications";
const POLL_INTERVAL = 60 * 1000; // 1 minuto (substitui o realtime do Supabase)

interface NotificationContextType {
  notifications: InAppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

type ServerNotification = Omit<InAppNotification, "isRead">;

const getReadNotifications = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    const data = JSON.parse(stored);
    const readIds = new Set<string>(data.ids || []);
    const lastCleanup = data.lastCleanup || 0;

    // Limpar notificações lidas antigas (mais de 7 dias)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (lastCleanup < sevenDaysAgo) {
      const today = new Date().toISOString().split("T")[0];
      return new Set(Array.from(readIds).filter((id) => id.includes(today)));
    }
    return readIds;
  } catch {
    return new Set();
  }
};

const saveReadNotifications = (readIds: Set<string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: Array.from(readIds), lastCleanup: Date.now() }));
  } catch (error) {
    console.error("Error saving read notifications:", error);
  }
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const knownIdsRef = useRef<Set<string> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const readIds = getReadNotifications();
      const data = await api<ServerNotification[]>("/api/notifications");

      const list: InAppNotification[] = data.map((n) => ({
        ...n,
        // A palavra do dia sempre aparece como não lida
        isRead: n.type === "daily_verse" ? false : readIds.has(n.id),
      }));

      // Avisar (toast) sobre novidades que chegaram desde a última verificação
      if (knownIdsRef.current) {
        for (const n of list) {
          if (!knownIdsRef.current.has(n.id) && n.type !== "daily_verse") {
            toast.success(`${n.icon ?? "🔔"} ${n.title}`);
          }
        }
      }
      knownIdsRef.current = new Set(list.map((n) => n.id));

      setNotifications(list);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    const readIds = getReadNotifications();
    readIds.add(notificationId);
    saveReadNotifications(readIds);
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    const allIds = new Set(notifications.map((n) => n.id));
    saveReadNotifications(allIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: fetchNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
