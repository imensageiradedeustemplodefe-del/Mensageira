import { prisma } from "@/lib/prisma";
import { error, handler, json, param, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";
import { postSelect, socialPostSchema, toDbDate } from "@/lib/social-posts";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function find(ctx: Ctx) {
  const id = await param(ctx, "id");
  return UUID.test(id) ? prisma.socialPost.findUnique({ where: { id }, select: { id: true } }) : null;
}

export const PATCH = handler(async (req, ctx: Ctx) => {
  await requireAdmin();
  const found = await find(ctx);
  if (!found) return error("Post não encontrado", 404);
  // só os campos enviados (o partial do zod preencheria os padrões e apagaria o resto)
  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object") return error("Dados inválidos");
  const parsed = socialPostSchema.partial().safeParse(raw);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Dados inválidos");
  const body = Object.fromEntries(Object.entries(parsed.data).filter(([k]) => k in raw)) as typeof parsed.data;
  const row = await prisma.socialPost.update({
    where: { id: found.id },
    data: { ...body, date: body.date ? toDbDate(body.date) : undefined },
    select: postSelect,
  });
  return json(snake(row));
});

export const DELETE = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const found = await find(ctx);
  if (!found) return error("Post não encontrado", 404);
  await prisma.socialPost.delete({ where: { id: found.id } });
  return json({ success: true });
});
