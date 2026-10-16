import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { handler, json, error, param, requireAdmin } from "@/lib/api";
import { organizerUrl } from "@/lib/organizer-link";

type Ctx = { params: Promise<{ id: string }> };

// Link das organizadoras: GET mostra o link atual, POST gera um novo (o anterior para de funcionar),
// DELETE desativa. Só administradores.

const current = (id: string) => prisma.event.findUnique({ where: { id }, select: { organizerToken: true } });

export const GET = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const event = await current(await param(ctx, "id"));
  if (!event) return error("Evento não encontrado", 404);
  return json({ url: event.organizerToken ? organizerUrl(event.organizerToken) : null });
});

export const POST = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const id = await param(ctx, "id");
  if (!(await current(id))) return error("Evento não encontrado", 404);
  const token = randomBytes(24).toString("base64url"); // 32 caracteres, impossível de adivinhar
  await prisma.event.update({ where: { id }, data: { organizerToken: token } });
  return json({ url: organizerUrl(token) });
});

export const DELETE = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const id = await param(ctx, "id");
  if (!(await current(id))) return error("Evento não encontrado", 404);
  await prisma.event.update({ where: { id }, data: { organizerToken: null } });
  return json({ url: null });
});
