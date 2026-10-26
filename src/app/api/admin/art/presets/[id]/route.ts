import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { error, handler, json, param, parseBody, requireAdmin } from "@/lib/api";
import { artSpecSchema } from "@/lib/art/spec";
import { deleteThumb, presetSelect, thumbUrlSchema } from "@/lib/art/presets";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Atualizar (nome e/ou arte) ou excluir um modelo salvo
export const PATCH = handler(async (req, ctx: Ctx) => {
  await requireAdmin();
  const id = await param(ctx, "id");
  if (!UUID.test(id)) return error("Modelo não encontrado", 404);
  const { name, spec, thumb_url } = await parseBody(
    req,
    z.object({ name: z.string().trim().min(2).max(80).optional(), spec: artSpecSchema.optional(), thumb_url: thumbUrlSchema.nullable().optional() }),
  );
  const existing = await prisma.artPreset.findUnique({ where: { id }, select: { thumbUrl: true } });
  if (!existing) return error("Modelo não encontrado", 404);
  const row = await prisma.artPreset.update({ where: { id }, data: { name, spec, thumbUrl: thumb_url }, select: presetSelect });
  // miniatura trocada: a antiga não serve mais para nada
  if (thumb_url !== undefined && existing.thumbUrl !== thumb_url) await deleteThumb(existing.thumbUrl);
  return json(row);
});

export const DELETE = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const id = await param(ctx, "id");
  const existing = UUID.test(id) ? await prisma.artPreset.findUnique({ where: { id }, select: { thumbUrl: true } }) : null;
  if (!existing) return error("Modelo não encontrado", 404);
  await prisma.artPreset.delete({ where: { id } });
  await deleteThumb(existing.thumbUrl);
  return json({ success: true });
});
