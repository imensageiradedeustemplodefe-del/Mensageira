import { prisma } from "@/lib/prisma";
import { handler, json, requireAdmin } from "@/lib/api";

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
  const r = await prisma.eventRegistration.updateMany({
    where: { id: registrationId, eventId },
    data: { contributionPaid: body.contribution_paid },
  });
  return json({ success: r.count > 0 });
});
