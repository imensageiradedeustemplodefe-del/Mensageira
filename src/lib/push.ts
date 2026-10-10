import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

// Urgência alta: no Android (FCM) mensagens "normal" ficam retidas enquanto o aparelho está em
// economia de energia (Doze) e só chegam quando o Chrome é aberto. "high" acorda o aparelho e
// entrega na hora. TTL de 24h: se o celular estiver sem internet, o aviso ainda chega no mesmo dia.
const SEND_OPTIONS = { urgency: "high" as const, TTL: 24 * 60 * 60 };

function configured() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:imensageiradedeustemplodefe@gmail.com", pub, priv);
  return true;
}

// Só aceita endereços dos serviços de push reais (Chrome/Android, Firefox, Safari/iPhone, Edge).
// Sem isso, qualquer um poderia cadastrar uma URL qualquer e fazer o servidor enviar requisições para ela.
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];
export function isValidPushEndpoint(endpoint: string) {
  try {
    const u = new URL(endpoint);
    return u.protocol === "https:" && !u.port && PUSH_HOSTS.some((re) => re.test(u.hostname));
  } catch {
    return false;
  }
}

interface Sub {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Sends a push notification to a single subscription. Returns false (and deactivates it) if the endpoint is dead. */
export async function sendPushTo(sub: Sub, payload: PushPayload) {
  if (!configured()) return false;
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ icon: "/icons/notification-192.png", ...payload }),
      SEND_OPTIONS
    );
    return true;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await prisma.pushSubscription.updateMany({ where: { id: sub.id }, data: { isActive: false } });
    }
    return false;
  }
}

/** Avisos só para os aparelhos da equipe que ativaram "Avisar este celular" no painel. */
export async function sendPushToAdmins(payload: PushPayload) {
  if (!configured()) return 0;
  const subs = await prisma.pushSubscription.findMany({ where: { isActive: true, notifyAdmin: true } });
  const results = await Promise.all(subs.map((s) => sendPushTo(s, payload)));
  return results.filter(Boolean).length;
}

/** Sends a push notification to every active subscription; prunes dead ones and records a log entry. */
export async function sendPushToAll(payload: PushPayload, source = "manual") {
  if (!configured()) return { sent: 0, failed: 0, skipped: true };

  const subs = await prisma.pushSubscription.findMany({ where: { isActive: true } });
  let sent = 0;
  let failed = 0;
  const dead: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ icon: "/icons/notification-192.png", ...payload }),
          SEND_OPTIONS
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(s.id);
      }
    })
  );

  if (dead.length) {
    await prisma.pushSubscription.updateMany({ where: { id: { in: dead } }, data: { isActive: false } });
  }
  try {
    await prisma.pushLog.create({ data: { source, title: payload.title, body: payload.body.slice(0, 500), sent, failed } });
  } catch (err) {
    console.error("push log:", err);
  }
  return { sent, failed, skipped: false };
}
