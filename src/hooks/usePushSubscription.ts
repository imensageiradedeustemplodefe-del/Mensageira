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

/** Endereço de push deste aparelho (null se as notificações não estiverem ativas aqui). */
export async function currentPushEndpoint() {
  try {
    if (!("serviceWorker" in navigator) || Notification.permission !== "granted") return null;
    const reg = await Promise.race([navigator.serviceWorker.ready, new Promise<null>((r) => setTimeout(() => r(null), 3000))]);
    return reg ? ((await reg.pushManager.getSubscription())?.endpoint ?? null) : null;
  } catch {
    return null;
  }
}

const OPT_OUT = "push_opt_out";
const SYNCED_AT = "push_synced_at";
const ENDPOINT = "push_endpoint"; // último endereço confirmado: a troca leva os avisos dele junto
const storage = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {
      /* sem armazenamento */
    }
  },
};

const newSubscription = (reg: ServiceWorkerRegistration, vapidKey: string) =>
  reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) });

/**
 * Mantém este aparelho recebendo avisos sem a pessoa precisar ativar de novo. A inscrição de push vence de
 * tempos em tempos (o Google troca o endereço) e, sem isto, o celular parava de receber em silêncio:
 * - permissão dada, mas a inscrição sumiu do navegador: inscreve de novo;
 * - o servidor marcou a inscrição como vencida (o Google respondeu 404/410): troca por uma nova;
 * - fora isso, confirma a inscrição no servidor 1x por dia.
 * Quem desativou pelo site (OPT_OUT) não é reinscrito.
 */
async function keepSubscriptionAlive(reg: ServiceWorkerRegistration) {
  let sub = await reg.pushManager.getSubscription();
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (Notification.permission !== "granted" || storage.get(OPT_OUT) === "1" || !vapidKey) return sub;
  try {
    const previous = storage.get(ENDPOINT);
    if (!sub) sub = await newSubscription(reg, vapidKey);
    const changed = sub.endpoint !== previous;
    if (!changed && Date.now() - Number(storage.get(SYNCED_AT) ?? 0) < 24 * 3600 * 1000) return sub;
    const res = await api<{ was_expired?: boolean }>("/api/push/subscribe", {
      method: "POST",
      json: { user_id: getPushUserId(), silent: true, replaces: changed && previous ? previous : undefined, subscription: sub.toJSON() },
    });
    if (res.was_expired) {
      // o endereço antigo não funciona mais: pede outro ao navegador
      const replaces = sub.endpoint;
      await sub.unsubscribe().catch(() => {});
      sub = await newSubscription(reg, vapidKey);
      await api("/api/push/subscribe", { method: "POST", json: { user_id: getPushUserId(), silent: true, replaces, subscription: sub.toJSON() } });
    }
    storage.set(SYNCED_AT, String(Date.now()));
    storage.set(ENDPOINT, sub.endpoint);
  } catch {
    /* tenta de novo na próxima visita */
  }
  return sub;
}

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
        const sub = await keepSubscriptionAlive(reg);
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
      storage.set(OPT_OUT, null);
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await newSubscription(reg, vapidKey));
      await api("/api/push/subscribe", { method: "POST", json: { user_id: getPushUserId(), subscription: sub.toJSON() } });
      storage.set(SYNCED_AT, String(Date.now()));
      storage.set(ENDPOINT, sub.endpoint);
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
      storage.set(OPT_OUT, "1");
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
