import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, error, parseBody } from "@/lib/api";

const REACTIONS = ["love", "prayer", "amen", "hallelujah", "glory", "fire"] as const;

// GET /api/reactions?photoId=... -> aggregated counts (never exposes user ids)
export const GET = handler(async (req) => {
  const photoId = new URL(req.url).searchParams.get("photoId");
  if (!photoId) return error("photoId é obrigatório");
  const rows = await prisma.photoReaction.groupBy({
    by: ["reactionType"],
    where: { photoId },
    _count: { _all: true },
  });
  return json(rows.map((r) => ({ reaction_type: r.reactionType, reaction_count: r._count._all })));
});

const schema = z.object({
  photo_id: z.string().min(1).max(200),
  user_id: z.string().uuid(),
  reaction_type: z.enum(REACTIONS),
});

// POST -> add/replace the user's reaction (mirrors add_photo_reaction)
export const POST = handler(async (req) => {
  const data = await parseBody(req, schema);
  await prisma.photoReaction.upsert({
    where: { photoId_userId: { photoId: data.photo_id, userId: data.user_id } },
    update: { reactionType: data.reaction_type },
    create: { photoId: data.photo_id, userId: data.user_id, reactionType: data.reaction_type },
  });
  return json({ success: true });
});

// DELETE -> remove own reaction (mirrors delete_own_reaction)
export const DELETE = handler(async (req) => {
  const data = await parseBody(req, schema.pick({ photo_id: true, user_id: true }));
  await prisma.photoReaction.deleteMany({ where: { photoId: data.photo_id, userId: data.user_id } });
  return json({ success: true });
});
