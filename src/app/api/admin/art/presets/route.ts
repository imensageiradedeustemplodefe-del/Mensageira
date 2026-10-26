import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, parseBody, requireAdmin } from "@/lib/api";
import { artSpecSchema } from "@/lib/art/spec";

// Modelos de arte salvos (admin e mídia: rota dentro de /api/admin/art)
const body = z.object({ name: z.string().trim().min(2).max(80), spec: artSpecSchema });

export const GET = handler(async () => {
  await requireAdmin();
  const rows = await prisma.artPreset.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, spec: true } });
  return json(rows);
});

export const POST = handler(async (req) => {
  const session = await requireAdmin();
  const { name, spec } = await parseBody(req, body);
  const row = await prisma.artPreset.create({ data: { name, spec, createdBy: session.user.username || null }, select: { id: true, name: true, spec: true } });
  return json(row, { status: 201 });
});
