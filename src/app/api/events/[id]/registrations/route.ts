import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, error, param, parseBody } from "@/lib/api";
import { snake } from "@/lib/case";
import { formatPhoneBR } from "@/lib/phone";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  registration_data: z.record(z.string(), z.unknown()),
});

export const POST = handler(async (req, ctx: Ctx) => {
  const id = await param(ctx, "id");
  const body = await parseBody(req, schema);

  const event = await prisma.event.findFirst({
    where: { id, isPublished: true, registrationRequired: true },
    include: { _count: { select: { registrations: true } } },
  });
  if (!event) return error("Evento não encontrado ou sem inscrições", 404);
  if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
    return error("As vagas para este evento estão esgotadas", 409);
  }

  // Telefones sempre no mesmo formato: (49) 99199-0484
  const phoneFields = await prisma.eventRegistrationField.findMany({
    where: { eventId: id, fieldType: { in: ["phone", "tel"] } },
    select: { fieldName: true },
  });
  const data = { ...body.registration_data };
  for (const f of phoneFields) if (typeof data[f.fieldName] === "string") data[f.fieldName] = formatPhoneBR(data[f.fieldName]);

  const registration = await prisma.eventRegistration.create({
    data: { eventId: id, registrationData: data as object },
  });

  return json(snake(registration), { status: 201 });
});
