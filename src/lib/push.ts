import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

function configured() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:imensageiradedeustemplodefe@gmail.com", pub, priv);
  return true;
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
      JSON.stringify({ icon: "/icons/notification-192.png", ...payload })
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
          JSON.stringify({ icon: "/icons/notification-192.png", ...payload })
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
