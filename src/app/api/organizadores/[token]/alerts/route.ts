import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, error, parseBody } from "@/lib/api";
import { sendPushTo } from "@/lib/push";
import { isOrganizerToken } from "@/lib/organizer-link";

type Ctx = { params: Promise<{ token: string }> };

// Link das organizadoras: liga/desliga, neste celular, os avisos do evento (nova inscrição, PIX informado).

async function eventOf(token: string) {
  if (!isOrganizerToken(token)) return null;
  return prisma.event.findUnique({ where: { organizerToken: token }, select: { id: true, title: true } });
}

export const GET = handler(async (req, ctx: Ctx) => {
  const event = await eventOf((await ctx.params).token);
  const endpoint = new URL(req.url).searchParams.get("endpoint");
  if (!event || !endpoint) return json({ enabled: false });
  const alert = await prisma.organizerAlert.findFirst({
    where: { eventId: event.id, subscription: { endpoint, isActive: true } },
    select: { id: true },
  });
  return json({ enabled: !!alert });
});

export const POST = handler(async (req, ctx: Ctx) => {
  const { token } = await ctx.params;
  const event = await eventOf(token);
  if (!event) return error("Este link foi desativado. Peça um novo para a igreja.", 404);
  const { endpoint, enabled } = await parseBody(req, z.object({ endpoint: z.string().url().max(1000), enabled: z.boolean() }));
  const sub = await prisma.pushSubscription.findUnique({ where: { endpoint } });
  if (!sub) return error("Ative as notificações neste celular primeiro", 404);

  if (!enabled) {
    await prisma.organizerAlert.deleteMany({ where: { eventId: event.id, subscriptionId: sub.id } });
    return json({ enabled: false });
  }

  await prisma.organizerAlert.upsert({
    where: { eventId_subscriptionId: { eventId: event.id, subscriptionId: sub.id } },
    update: {},
    create: { eventId: event.id, subscriptionId: sub.id },
  });
  const active = sub.isActive ? sub : await prisma.pushSubscription.update({ where: { id: sub.id }, data: { isActive: true } });
  await sendPushTo(active, {
    title: `Avisos do ${event.title} ativados ✓`,
    body: "Este celular vai receber um aviso quando alguém se inscrever ou avisar que fez o PIX.",
    url: `/organizadores/${token}`,
    tag: `org-alerts-${event.id}`,
  });
  return json({ enabled: true });
});
