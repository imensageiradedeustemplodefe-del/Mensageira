import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, error, parseBody, requireAdmin } from "@/lib/api";
import { sendPushTo } from "@/lib/push";

// Liga/desliga os avisos da equipe (novas inscrições, PIX informado) para um aparelho.
export const GET = handler(async (req) => {
  await requireAdmin();
  const endpoint = new URL(req.url).searchParams.get("endpoint");
  if (!endpoint) return json({ enabled: false });
  const sub = await prisma.pushSubscription.findUnique({ where: { endpoint }, select: { isActive: true, notifyAdmin: true } });
  return json({ enabled: !!sub?.isActive && !!sub.notifyAdmin });
});

export const POST = handler(async (req) => {
  await requireAdmin();
  const { endpoint, enabled } = await parseBody(req, z.object({ endpoint: z.string().url(), enabled: z.boolean() }));
  const sub = await prisma.pushSubscription.findUnique({ where: { endpoint } });
  if (!sub) return error("Ative as notificações neste aparelho primeiro", 404);
  const updated = await prisma.pushSubscription.update({ where: { endpoint }, data: { notifyAdmin: enabled, ...(enabled ? { isActive: true } : {}) } });
  if (enabled) {
    await sendPushTo(updated, {
      title: "Avisos da equipe ativados ✓",
      body: "Este celular vai receber um aviso quando alguém se inscrever num evento ou informar um PIX.",
      url: "/admin?tab=registrations",
      tag: "admin-alerts",
    });
  }
  return json({ enabled });
});
