import { prisma } from "@/lib/prisma";
import { handler, json, param, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const eventId = await param(ctx, "id");
  const registrations = await prisma.eventRegistration.findMany({ where: { eventId }, orderBy: { createdAt: "desc" } });
  return json(snake(registrations));
});
