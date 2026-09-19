"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, BellRing, CheckCheck, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { api } from "@/lib/fetcher";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

const getPushUserId = () => {
  let id = localStorage.getItem("push_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("push_user_id", id);
  }
  return id;
};

const usePushNotificationStatus = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);
    if (!supported) return;
    setPermission(Notification.permission);
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setIsEnabled(Notification.permission === "granted" && !!sub);
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error("Seu navegador não suporta notificações push.");
      return;
    }
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      toast.error("Notificações push ainda não configuradas no servidor.");
      return;
    }
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        if (result === "denied") toast.error("Permissão negada. Ative nas configurações do navegador.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) }));
      await api("/api/push/subscribe", { method: "POST", json: { user_id: getPushUserId(), subscription: sub.toJSON() } });
      setIsEnabled(true);
      toast.success("Notificações push ativadas!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao ativar notificações.");
    } finally {
      setBusy(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api("/api/push/subscribe", { method: "DELETE", json: { endpoint: sub.endpoint } }).catch(() => {});
        await sub.unsubscribe();
      }
      setIsEnabled(false);
      toast.success("Notificações push desativadas.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao desativar notificações.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { isSupported, isEnabled, permission, busy, subscribe, unsubscribe };
};

export const NotificationCenter = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useInAppNotifications();
  const router = useRouter();
  const { isSupported, isEnabled, permission, busy, subscribe, unsubscribe } = usePushNotificationStatus();

  const handleNotificationClick = (notificationId: string, url: string | null) => {
    markAsRead(notificationId);
    if (url) router.push(url);
  };

  const getTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ptBR });
    } catch {
      return "há algum tempo";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
              {isEnabled ? <BellRing className="w-5 h-5 text-primary" /> : <Smartphone className="w-5 h-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Notificações Push</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {!isSupported
                  ? "Não suportado neste navegador"
                  : isEnabled
                    ? "Ativadas — você receberá alertas"
                    : permission === "denied"
                      ? "Bloqueadas — ative nas configurações do navegador"
                      : "Receba alertas de eventos, lives e novidades"}
              </p>
            </div>
            {isSupported && permission !== "denied" && (
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => (checked ? subscribe() : unsubscribe())}
                disabled={busy}
              />
            )}
            {isSupported && permission === "denied" && <span className="text-xs text-destructive font-medium">Bloqueada</span>}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Notificações</h2>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
            <CheckCheck className="w-4 h-4 mr-1" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma notificação ainda</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-2">
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.isRead ? "border-l-4 border-l-primary bg-primary/5" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification.id, notification.url)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                            !notification.isRead ? "bg-primary/20" : "bg-muted"
                          }`}
                        >
                          {notification.icon}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`text-sm font-semibold ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{getTimeAgo(notification.timestamp)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {index < notifications.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
