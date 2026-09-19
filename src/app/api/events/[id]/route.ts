import { prisma } from "@/lib/prisma";
import { handler, json, error, param } from "@/lib/api";
import { snake } from "@/lib/case";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req, ctx: Ctx) => {
  const id = await param(ctx, "id");
  const event = await prisma.event.findFirst({
    where: { id, isPublished: true },
    include: {
      contacts: { select: { contactInfo: true } },
      registrationFields: { orderBy: { fieldOrder: "asc" } },
      _count: { select: { registrations: true } },
    },
  });
  if (!event) return error("Evento não encontrado", 404);
  const { contacts, registrationFields, _count, ...rest } = event;
  return json(
    snake({
      ...rest,
      contactInfo: contacts[0]?.contactInfo ?? null,
      registrationFields,
      registrationsCount: _count.registrations,
    })
  );
});
