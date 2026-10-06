import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, parseBody, requireAdmin } from "@/lib/api";
import { CHURCH_LOCATION, RECURRING_RULES, describeRule, planYear } from "@/lib/recurring-events";

export const maxDuration = 60;

const schema = z.object({
  year: z.number().int().min(2024).max(2100),
  /** true = só calcula (prévia), não grava nada */
  preview: z.boolean().optional(),
});

// Gera os eventos fixos (cultos, Santa Ceia, Louvorzão, Lavacar...) de um ano inteiro.
// Pode rodar quantas vezes quiser: eventos que já existem (mesmo título e horário) são pulados.
export const POST = handler(async (req) => {
  await requireAdmin();
  const { year, preview } = await parseBody(req, schema);

  // No ano atual, só daqui para frente
  const now = new Date();
  const plan = planYear(year, year === now.getFullYear() ? now : undefined);

  const start = new Date(`${year}-01-01T00:00:00-03:00`);
  const end = new Date(`${year + 1}-01-01T00:00:00-03:00`);
  const existing = await prisma.event.findMany({
    where: { eventDate: { gte: start, lt: end } },
    select: { title: true, eventDate: true },
  });
  const have = new Set(existing.map((e) => `${e.title}|${e.eventDate.toISOString()}`));
  const missing = plan.filter((p) => !have.has(`${p.rule.title}|${p.date.toISOString()}`));

  const byRule = RECURRING_RULES.map((r) => ({
    title: r.title,
    rule: describeRule(r),
    total: plan.filter((p) => p.rule === r).length,
    toCreate: missing.filter((p) => p.rule === r).length,
  }));

  if (preview) {
    return json({ year, total: plan.length, toCreate: missing.length, existing: plan.length - missing.length, byRule });
  }

  if (missing.length > 0) {
    await prisma.event.createMany({
      data: missing.map((p) => ({
        title: p.rule.title,
        description: p.rule.description,
        eventDate: p.date,
        location: CHURCH_LOCATION,
        category: p.rule.category,
        isPublished: true,
        registrationRequired: false,
      })),
    });
  }

  return json({ year, created: missing.length, skipped: plan.length - missing.length, byRule });
});
