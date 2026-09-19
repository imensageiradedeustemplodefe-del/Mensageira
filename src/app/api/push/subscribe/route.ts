import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, parseBody } from "@/lib/api";

const schema = z.object({
  user_id: z.string().uuid(),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({ p256dh: z.string(), auth: z.string() }),
  }),
});

export const POST = handler(async (req) => {
  const { user_id, subscription } = await parseBody(req, schema);
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { userId: user_id, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, isActive: true },
    create: { userId: user_id, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
  });
  return json({ success: true });
});

export const DELETE = handler(async (req) => {
  const { endpoint } = await parseBody(req, z.object({ endpoint: z.string().url() }));
  await prisma.pushSubscription.updateMany({ where: { endpoint }, data: { isActive: false } });
  return json({ success: true });
});
