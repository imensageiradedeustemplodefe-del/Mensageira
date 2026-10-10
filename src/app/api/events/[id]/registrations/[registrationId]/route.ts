import { prisma } from "@/lib/prisma";
import { handler, json, error } from "@/lib/api";
import { registrationCode } from "@/lib/pix";

type Ctx = { params: Promise<{ id: string; registrationId: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function find(ctx: Ctx) {
  const { id: eventId, registrationId } = await ctx.params;
  if (!UUID.test(eventId) || !UUID.test(registrationId)) return null;
  return prisma.eventRegistration.findFirst({
    where: { id: registrationId, eventId },
    select: { id: true, contributionPaid: true, paymentReportedAt: true },
  });
}

const status = (r: { id: string; contributionPaid: boolean; paymentReportedAt: Date | null }) => ({
  code: registrationCode(r.id),
  contribution_paid: r.contributionPaid,
  payment_reported_at: r.paymentReportedAt,
});

// Situação da inscrição para a própria pessoa (só quem tem o id, guardado no aparelho dela). Sem dados pessoais.
export const GET = handler(async (_req, ctx: Ctx) => {
  const r = await find(ctx);
  if (!r) return error("Inscrição não encontrada", 404);
  return json(status(r), { headers: { "Cache-Control": "no-store" } });
});

// "Já fiz o PIX": a pessoa avisa que pagou; quem confirma é a equipe no painel.
export const PATCH = handler(async (_req, ctx: Ctx) => {
  const r = await find(ctx);
  if (!r) return error("Inscrição não encontrada", 404);
  if (r.contributionPaid || r.paymentReportedAt) return json(status(r));
  const updated = await prisma.eventRegistration.update({
    where: { id: r.id },
    data: { paymentReportedAt: new Date() },
    select: { id: true, contributionPaid: true, paymentReportedAt: true },
  });
  return json(status(updated));
});
