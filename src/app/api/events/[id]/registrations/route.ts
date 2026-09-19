import { after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, error, param, parseBody } from "@/lib/api";
import { snake } from "@/lib/case";
import { syncEventRegistrations } from "@/lib/sheets";

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

  const registration = await prisma.eventRegistration.create({
    data: { eventId: id, registrationData: body.registration_data as object },
  });

  // Sincroniza com o Google Sheets em segundo plano (não bloqueia a resposta)
  after(async () => {
    try {
      await syncEventRegistrations(id);
    } catch (err) {
      console.warn("[registrations] sync to sheets skipped:", err instanceof Error ? err.message : err);
    }
  });

  return json(snake(registration), { status: 201 });
});
