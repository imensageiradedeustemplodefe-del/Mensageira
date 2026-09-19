import { prisma } from "@/lib/prisma";
import { handler, json, requireAdmin } from "@/lib/api";

type Ctx = { params: Promise<{ id: string; registrationId: string }> };

export const DELETE = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const { id: eventId, registrationId } = await ctx.params;
  await prisma.eventRegistration.deleteMany({ where: { id: registrationId, eventId } });
  return json({ success: true });
});
