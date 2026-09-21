import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { after } from "next/server";
import { handler, json, parseBody } from "@/lib/api";
import { sendPushTo } from "@/lib/push";

const schema = z.object({
  user_id: z.string().uuid(),
  silent: z.boolean().optional(), // re-sincronização automática: não manda boas-vindas
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({ p256dh: z.string(), auth: z.string() }),
  }),
});

export const POST = handler(async (req) => {
  const { user_id, subscription, silent } = await parseBody(req, schema);
  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint: subscription.endpoint } });
  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { userId: user_id, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, isActive: true },
    create: { userId: user_id, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
  });

  // Mensagem de boas-vindas ao ativar (ou reativar) — serve de teste imediato para a pessoa
  const activated = !existing || !existing.isActive;
  if (activated && !silent) {
    after(() =>
      sendPushTo(sub, {
        title: "Notificações ativadas! 🕊️",
        body: "Tudo certo! Você vai receber o versículo do dia, avisos de cultos, eventos e transmissões ao vivo.",
        url: "/",
        tag: "welcome",
      })
    );
  }
  return json({ success: true, welcome_sent: activated });
});

export const DELETE = handler(async (req) => {
  const { endpoint } = await parseBody(req, z.object({ endpoint: z.string().url() }));
  await prisma.pushSubscription.updateMany({ where: { endpoint }, data: { isActive: false } });
  return json({ success: true });
});
