import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, json, requireAdmin } from "@/lib/api";
import { sendPushTo } from "@/lib/push";

type Ctx = { params: Promise<{ id: string; registrationId: string }> };

export const DELETE = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const { id: eventId, registrationId } = await ctx.params;
  await prisma.eventRegistration.deleteMany({ where: { id: registrationId, eventId } });
  return json({ success: true });
});

// Marca a contribuição (PIX) como paga ou pendente
export const PATCH = handler(async (req, ctx: Ctx) => {
  await requireAdmin();
  const { id: eventId, registrationId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { contribution_paid?: unknown };
  if (typeof body.contribution_paid !== "boolean") return json({ error: "contribution_paid deve ser true/false" }, { status: 400 });

  const before = await prisma.eventRegistration.findFirst({
    where: { id: registrationId, eventId },
    select: { contributionPaid: true, pushEndpoint: true, event: { select: { title: true } } },
  });
  if (!before) return json({ success: false });
  await prisma.eventRegistration.update({ where: { id: registrationId }, data: { contributionPaid: body.contribution_paid } });

  // Confirmou agora: avisa o celular da pessoa (se ela pediu para ser avisada)
  let notified = false;
  if (body.contribution_paid && !before.contributionPaid && before.pushEndpoint) {
    const sub = await prisma.pushSubscription.findFirst({ where: { endpoint: before.pushEndpoint, isActive: true } });
    if (sub) {
      notified = true;
      after(() =>
        sendPushTo(sub, {
          title: "Pagamento confirmado ✓",
          body: `Sua contribuição para o ${before.event.title} foi confirmada. Obrigado e até lá! 🙏`,
          url: `/eventos/${eventId}/inscricao`,
          tag: `pagamento-${registrationId}`,
        })
      );
    }
  }
  return json({ success: true, notified });
});
