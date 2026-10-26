import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, parseBody, requireAdmin } from "@/lib/api";
import { artSpecSchema } from "@/lib/art/spec";
import { presetSelect, thumbUrlSchema } from "@/lib/art/presets";

// Modelos de arte salvos (admin e mídia: rota dentro de /api/admin/art)
const body = z.object({ name: z.string().trim().min(2).max(80), spec: artSpecSchema, thumb_url: thumbUrlSchema.nullable().optional() });

export const GET = handler(async () => {
  await requireAdmin();
  const rows = await prisma.artPreset.findMany({ orderBy: { name: "asc" }, select: presetSelect });
  return json(rows);
});

export const POST = handler(async (req) => {
  const session = await requireAdmin();
  const { name, spec, thumb_url } = await parseBody(req, body);
  const row = await prisma.artPreset.create({
    data: { name, spec, thumbUrl: thumb_url ?? null, createdBy: session.user.username || null },
    select: presetSelect,
  });
  return json(row, { status: 201 });
});
