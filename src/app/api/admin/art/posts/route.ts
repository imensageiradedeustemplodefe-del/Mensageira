import { prisma } from "@/lib/prisma";
import { error, handler, json, parseBody, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";
import { postSelect, socialPostSchema, toDbDate } from "@/lib/social-posts";

// Calendário de posts (admin e mídia). GET ?month=2026-11 traz o mês (com a semana antes e depois).
export const GET = handler(async (req) => {
  await requireAdmin();
  const month = new URL(req.url).searchParams.get("month") ?? "";
  const m = month.match(/^(\d{4})-(\d{2})$/);
  if (!m) return error("Mês inválido");
  const start = new Date(Date.UTC(+m[1], +m[2] - 1, 1) - 7 * 86400000);
  const end = new Date(Date.UTC(+m[1], +m[2], 1) + 7 * 86400000);
  const rows = await prisma.socialPost.findMany({ where: { date: { gte: start, lt: end } }, orderBy: [{ date: "asc" }, { createdAt: "asc" }], select: postSelect });
  return json(snake(rows));
});

export const POST = handler(async (req) => {
  const session = await requireAdmin();
  const body = await parseBody(req, socialPostSchema);
  const row = await prisma.socialPost.create({ data: { ...body, date: toDbDate(body.date), createdBy: session.user.username || null }, select: postSelect });
  return json(snake(row), { status: 201 });
});
