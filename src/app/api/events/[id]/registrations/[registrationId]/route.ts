import { z } from "zod";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, json, error } from "@/lib/api";
import { registrationCode } from "@/lib/pix";
import { alertAdminsAboutRegistration } from "@/lib/registration-alerts";
import { limitOrThrow } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string; registrationId: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SELECT = { id: true, contributionPaid: true, paymentReportedAt: true, pushEndpoint: true, paymentMethod: true } as const;

async function find(ctx: Ctx) {
  const { id: eventId, registrationId } = await ctx.params;
  if (!UUID.test(eventId) || !UUID.test(registrationId)) return null;
  return prisma.eventRegistration.findFirst({ where: { id: registrationId, eventId }, select: SELECT });
}

const status = (r: { id: string; contributionPaid: boolean; paymentReportedAt: Date | null; pushEndpoint: string | null; paymentMethod: string | null }) => ({
  code: registrationCode(r.id),
  contribution_paid: r.contributionPaid,
  payment_reported_at: r.paymentReportedAt,
  payment_method: r.paymentMethod,
  notify: !!r.pushEndpoint, // este aparelho será avisado por notificação quando confirmarem
});

// Situação da inscrição para a própria pessoa (só quem tem o id, guardado no aparelho dela). Sem dados pessoais.
export const GET = handler(async (_req, ctx: Ctx) => {
  const r = await find(ctx);
  if (!r) return error("Inscrição não encontrada", 404);
  return json(status(r), { headers: { "Cache-Control": "no-store" } });
});

const schema = z.object({
  report: z.boolean().optional(), // "Já fiz o PIX"
  push_endpoint: z.string().url().max(1000).optional(), // avisar este aparelho quando confirmarem
  payment_method: z.enum(["pix", "cash"]).optional(), // PIX ou dinheiro no dia
});

export const PATCH = handler(async (req, ctx: Ctx) => {
  await limitOrThrow(req, "reg-status", 30, 600);
  const r = await find(ctx);
  if (!r) return error("Inscrição não encontrada", 404);
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return error("Dados inválidos");
  const { report, push_endpoint, payment_method } = body.data;

  const data: { paymentReportedAt?: Date; pushEndpoint?: string; paymentMethod?: string } = {};
  if (report && !r.contributionPaid && !r.paymentReportedAt) {
    data.paymentReportedAt = new Date();
    data.paymentMethod = "pix";
  }
  // escolha da forma de pagamento (só enquanto não foi pago nem avisado o PIX)
  if (payment_method && !report && !r.contributionPaid && !r.paymentReportedAt && payment_method !== r.paymentMethod) data.paymentMethod = payment_method;
  // só aceita endpoints que já estão cadastrados como assinatura de notificação do site
  if (push_endpoint && push_endpoint !== r.pushEndpoint) {
    const sub = await prisma.pushSubscription.findUnique({ where: { endpoint: push_endpoint }, select: { isActive: true } });
    if (sub?.isActive) data.pushEndpoint = push_endpoint;
  }
  if (!Object.keys(data).length) return json(status(r));
  const updated = await prisma.eventRegistration.update({ where: { id: r.id }, data, select: SELECT });
  if (data.paymentReportedAt) after(() => alertAdminsAboutRegistration(r.id, "pix"));
  return json(status(updated));
});
