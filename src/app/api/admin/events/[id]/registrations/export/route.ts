import { prisma } from "@/lib/prisma";
import { handler, error, param, requireAdmin } from "@/lib/api";
import { formatPhoneBR, isPhoneFieldType } from "@/lib/phone";

type Ctx = { params: Promise<{ id: string }> };

// Planilha das inscrições (CSV que abre direto no Excel e no Google Planilhas).
// Separador ";" e BOM UTF-8: é o formato que o Excel em português abre certinho, com acentos.
export const GET = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const eventId = await param(ctx, "id");

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { title: true, eventDate: true, contributionCents: true } });
  if (!event) return error("Evento não encontrado", 404);

  const [fields, registrations] = await Promise.all([
    prisma.eventRegistrationField.findMany({ where: { eventId }, orderBy: { fieldOrder: "asc" } }),
    prisma.eventRegistration.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } }),
  ]);

  // Colunas: campos do formulário (na ordem do painel) + qualquer dado extra que tenha vindo
  const columns = fields.map((f) => ({ key: f.fieldName, label: f.fieldLabel, phone: isPhoneFieldType(f.fieldType) }));
  const known = new Set(columns.map((c) => c.key));
  for (const r of registrations) {
    for (const key of Object.keys((r.registrationData as Record<string, unknown>) ?? {})) {
      if (!known.has(key)) {
        known.add(key);
        columns.push({ key, label: key, phone: false });
      }
    }
  }

  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Sim" : "Não") : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const fmt = (d: Date) => d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const withPay = !!event.contributionCents;
  const header = ["Nº", "Data da inscrição", ...columns.map((c) => c.label), ...(withPay ? ["Contribuição"] : [])];
  const rows = registrations.map((r, i) => {
    const data = (r.registrationData as Record<string, unknown>) ?? {};
    return [String(i + 1), fmt(r.createdAt), ...columns.map((c) => (c.phone && data[c.key] ? formatPhoneBR(data[c.key]) : data[c.key])), ...(withPay ? [r.contributionPaid ? "Pago" : "Pendente"] : [])];
  });
  const csv = "﻿" + [header, ...rows].map((row) => row.map(cell).join(";")).join("\r\n") + "\r\n";

  const date = event.eventDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }).replace(/\//g, "-");
  const name = `Inscrições - ${event.title} - ${date}.csv`.replace(/[\/:*?"<>|]/g, "");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscricoes.csv"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "no-store",
    },
  });
});
