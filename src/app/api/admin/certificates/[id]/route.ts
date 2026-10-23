import { prisma } from "@/lib/prisma";
import { error, handler, json, param, parseBody, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";
import { certificateBody, validateCertificate } from "@/lib/certificate-records";

type Ctx = { params: Promise<{ id: string }> };

// Corrige um certificado já emitido (mantém o número)
export const PATCH = handler(async (req, ctx: Ctx) => {
  await requireAdmin();
  const id = await param(ctx, "id");
  const existing = await prisma.certificate.findUnique({ where: { id } });
  if (!existing) return error("Certificado não encontrado", 404);
  const body = await parseBody(req, certificateBody);
  const { data, recipientName } = validateCertificate(existing.type, body.data);
  const record = await prisma.certificate.update({
    where: { id },
    data: { data, recipientName, memberId: body.member_id === undefined ? existing.memberId : body.member_id },
  });
  return json(snake(record));
});

export const DELETE = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const id = await param(ctx, "id");
  const existing = await prisma.certificate.findUnique({ where: { id } });
  if (!existing) return error("Certificado não encontrado", 404);
  await prisma.certificate.delete({ where: { id } });
  return json({ success: true });
});
