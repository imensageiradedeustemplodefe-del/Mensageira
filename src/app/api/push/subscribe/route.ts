import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { after } from "next/server";
import { handler, json, parseBody } from "@/lib/api";
import { sendPushTo, isValidPushEndpoint } from "@/lib/push";
import { limitOrThrow } from "@/lib/rate-limit";

const ANON = "00000000-0000-4000-8000-000000000000"; // service worker não sabe o id do aparelho

const schema = z.object({
  user_id: z.string().uuid(),
  silent: z.boolean().optional(), // re-sincronização automática: não manda boas-vindas
  /** endereço antigo que esta inscrição substitui (renovação pelo navegador) */
  replaces: z.string().url().max(1000).optional(),
  subscription: z.object({
    endpoint: z.string().url().max(1000).refine(isValidPushEndpoint, "Endereço de notificação inválido"),
    keys: z.object({ p256dh: z.string().min(20).max(200), auth: z.string().min(8).max(100) }),
  }),
});

export const POST = handler(async (req) => {
  await limitOrThrow(req, "push-sub", 20, 600);
  const { user_id, subscription, silent, replaces } = await parseBody(req, schema);
  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint: subscription.endpoint } });

  // Venceu (o serviço de push respondeu 404/410): não adianta reativar este endereço. O aparelho pede
  // outro ao navegador e manda de novo com `replaces`.
  if (existing && !existing.isActive && existing.expiredAt) return json({ success: true, was_expired: true });

  // Renovação: a inscrição nova herda o dono e os avisos da antiga ("Avisar este aparelho", organizadoras)
  const old =
    replaces && replaces !== subscription.endpoint ? await prisma.pushSubscription.findUnique({ where: { endpoint: replaces } }) : null;
  const userId = user_id === ANON && old ? old.userId : user_id;

  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, isActive: true, expiredAt: null, ...(old?.notifyAdmin ? { notifyAdmin: true } : {}) },
    create: { userId, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, notifyAdmin: old?.notifyAdmin ?? false },
  });
  if (old) {
    await prisma.organizerAlert.updateMany({ where: { subscriptionId: old.id }, data: { subscriptionId: sub.id } }).catch(() => {});
    // inscrições em eventos que avisam este aparelho ("pagamento confirmado")
    await prisma.eventRegistration.updateMany({ where: { pushEndpoint: old.endpoint }, data: { pushEndpoint: sub.endpoint } }).catch(() => {});
    // a antiga não serve mais para nada: sai do banco (os avisos dela já passaram para a nova)
    await prisma.pushSubscription.delete({ where: { id: old.id } }).catch(() => {});
  }

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
  return json({ success: true, welcome_sent: activated && !silent, was_expired: false });
});

export const DELETE = handler(async (req) => {
  const { endpoint } = await parseBody(req, z.object({ endpoint: z.string().url() }));
  await prisma.pushSubscription.updateMany({ where: { endpoint }, data: { isActive: false } });
  return json({ success: true });
});

// Chave pública de envio: o service worker precisa dela para renovar a inscrição sozinho
export const GET = handler(async () =>
  json({ key: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null }, { headers: { "Cache-Control": "public, max-age=3600" } }),
);
