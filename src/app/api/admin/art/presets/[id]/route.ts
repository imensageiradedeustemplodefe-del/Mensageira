import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { error, handler, json, param, parseBody, requireAdmin } from "@/lib/api";
import { artSpecSchema } from "@/lib/art/spec";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Atualizar (nome e/ou arte) ou excluir um modelo salvo
export const PATCH = handler(async (req, ctx: Ctx) => {
  await requireAdmin();
  const id = await param(ctx, "id");
  if (!UUID.test(id)) return error("Modelo não encontrado", 404);
  const data = await parseBody(req, z.object({ name: z.string().trim().min(2).max(80).optional(), spec: artSpecSchema.optional() }));
  if (!(await prisma.artPreset.findUnique({ where: { id }, select: { id: true } }))) return error("Modelo não encontrado", 404);
  const row = await prisma.artPreset.update({ where: { id }, data, select: { id: true, name: true, spec: true } });
  return json(row);
});

export const DELETE = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const id = await param(ctx, "id");
  if (!UUID.test(id) || !(await prisma.artPreset.findUnique({ where: { id }, select: { id: true } }))) return error("Modelo não encontrado", 404);
  await prisma.artPreset.delete({ where: { id } });
  return json({ success: true });
});
