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

/** Sends a push notification to every active subscription; prunes dead ones. */
export async function sendPushToAll(payload: PushPayload) {
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
          JSON.stringify({ icon: "/images/logo-icon.png", ...payload })
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
  return { sent, failed, skipped: false };
}
