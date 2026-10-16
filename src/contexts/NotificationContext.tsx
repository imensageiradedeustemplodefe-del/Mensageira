"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { api } from "@/lib/fetcher";
import type { InAppNotification } from "@/types/notifications";

const STORAGE_KEY = "read_notifications";
// A cada 5 min e só com a tela visível: cada verificação de cada aparelho custava 7 consultas ao banco
const POLL_INTERVAL = 5 * 60 * 1000;
const FOCUS_MIN_GAP = 60 * 1000; // ao voltar para o app, atualiza se faz mais de 1 min

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
    return new Set<string>(data.ids || []);
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

      // A palavra do dia tem a data no id (daily_verse_yyyy-MM-dd): lida hoje, volta como nova amanhã
      const list: InAppNotification[] = data.map((n) => ({ ...n, isRead: readIds.has(n.id) }));

      // Limpeza: guarda só os ids que o servidor ainda devolve (os antigos saem sozinhos)
      const current = new Set(data.map((n) => n.id));
      const pruned = new Set([...readIds].filter((id) => current.has(id)));
      if (pruned.size !== readIds.size) saveReadNotifications(pruned);

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
    const readIds = getReadNotifications();
    notifications.forEach((n) => readIds.add(n.id));
    saveReadNotifications(readIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    let last = 0;
    const refresh = (minGap: number) => {
      if (document.visibilityState !== "visible" || Date.now() - last < minGap) return;
      last = Date.now();
      fetchNotifications();
    };
    refresh(0);
    // aba em segundo plano não verifica; ao voltar, atualiza se já faz um tempo
    const interval = setInterval(() => refresh(POLL_INTERVAL - 5000), POLL_INTERVAL);
    const onFocus = () => refresh(FOCUS_MIN_GAP);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
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
