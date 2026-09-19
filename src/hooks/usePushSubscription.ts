"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
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

// Web Push subscription state + actions (shared by the notification center and the opt-in banner).
export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);
    if (!supported) {
      setReady(true);
      return;
    }
    setPermission(Notification.permission);
    navigator.serviceWorker.ready
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setIsEnabled(Notification.permission === "granted" && !!sub);
      })
      .finally(() => setReady(true));
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error("Seu navegador não suporta notificações push.");
      return false;
    }
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      toast.error("Notificações push ainda não configuradas no servidor.");
      return false;
    }
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        if (result === "denied") toast.error("Permissão negada. Ative nas configurações do navegador.");
        return false;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) }));
      await api("/api/push/subscribe", { method: "POST", json: { user_id: getPushUserId(), subscription: sub.toJSON() } });
      setIsEnabled(true);
      toast.success("Notificações ativadas! Enviamos uma mensagem de teste para você.");
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Erro ao ativar notificações.");
      return false;
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

  return { isSupported, isEnabled, permission, ready, busy, subscribe, unsubscribe };
}
