import { prisma } from "@/lib/prisma";
import { handler, json, error, param } from "@/lib/api";
import { snake } from "@/lib/case";
import { publicCache } from "@/lib/public-cache";

type Ctx = { params: Promise<{ id: string }> };

const getEvent = publicCache("event", 120, async (id: string) => {
  const event = await prisma.event.findFirst({
    where: { id, isPublished: true },
    include: {
      contacts: { select: { contactInfo: true } },
      registrationFields: { orderBy: { fieldOrder: "asc" } },
      _count: { select: { registrations: true } },
    },
  });
  if (!event) return null;
  const { contacts, registrationFields, _count, ...rest } = event;
  return snake({
    ...rest,
    contactInfo: contacts[0]?.contactInfo ?? null,
    registrationFields,
    registrationsCount: _count.registrations,
  });
});

export const GET = handler(async (_req, ctx: Ctx) => {
  const event = await getEvent(await param(ctx, "id"));
  if (!event) return error("Evento não encontrado", 404);
  return json(event);
});
