import { prisma } from "@/lib/prisma";
import { handler, json, parseBody, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";
import { certificateBody, validateCertificate } from "@/lib/certificate-records";

export const GET = handler(async () => {
  await requireAdmin();
  const rows = await prisma.certificate.findMany({ orderBy: [{ year: "desc" }, { number: "desc" }] });
  return json(snake(rows));
});

// Emite um certificado com o próximo número do ano (1/2026, 2/2026...)
export const POST = handler(async (req) => {
  await requireAdmin();
  const body = await parseBody(req, certificateBody);
  const { data, recipientName } = validateCertificate(body.type, body.data);
  const year = Number(new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 4));
  for (let attempt = 0; ; attempt++) {
    const last = await prisma.certificate.findFirst({ where: { year }, orderBy: { number: "desc" }, select: { number: true } });
    try {
      const record = await prisma.certificate.create({
        data: { type: body.type, year, number: (last?.number ?? 0) + 1, memberId: body.member_id ?? null, recipientName, data },
      });
      return json(snake(record), { status: 201 });
    } catch (err) {
      // dois certificados emitidos ao mesmo tempo: tenta o número seguinte
      if (attempt < 3 && (err as { code?: string }).code === "P2002") continue;
      throw err;
    }
  }
});
