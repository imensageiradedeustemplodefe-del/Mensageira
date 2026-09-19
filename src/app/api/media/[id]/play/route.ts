import { prisma } from "@/lib/prisma";
import { handler, json, param } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// Increments the play counter of a media item.
export const POST = handler(async (_req, ctx: Ctx) => {
  const id = await param(ctx, "id");
  await prisma.mediaItem.updateMany({ where: { id, isPublished: true }, data: { playCount: { increment: 1 } } });
  return json({ success: true });
});
