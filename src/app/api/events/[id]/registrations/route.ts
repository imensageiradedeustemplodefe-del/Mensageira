import { z } from "zod";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, json, error, param, parseBody } from "@/lib/api";
import { formatPhoneBR, isPhoneFieldType } from "@/lib/phone";
import { alertAdminsAboutRegistration } from "@/lib/registration-alerts";
import { limitOrThrow } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

const value = z.union([z.string().max(2000), z.number(), z.boolean(), z.array(z.string().max(200)).max(50), z.null()]);
const schema = z.object({
  registration_data: z.record(z.string().max(100), value),
});

export const POST = handler(async (req, ctx: Ctx) => {
  // generoso: na igreja muita gente se inscreve pelo mesmo Wi-Fi (mesmo IP)
  await limitOrThrow(req, "registration", 30, 600);
  const id = await param(ctx, "id");
  const body = await parseBody(req, schema);

  const event = await prisma.event.findFirst({
    where: { id, isPublished: true, registrationRequired: true },
    include: {
      _count: { select: { registrations: true } },
      registrationFields: { select: { fieldName: true, fieldLabel: true, fieldType: true, isRequired: true, fieldOptions: true } },
    },
  });
  if (!event) return error("Evento não encontrado ou sem inscrições", 404);
  if (event.eventDate.getTime() < Date.now() - 6 * 3600 * 1000) return error("As inscrições para este evento já foram encerradas", 409);
  if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
    return error("As vagas para este evento estão esgotadas", 409);
  }

  // Só guarda os campos que existem no formulário do evento (ignora qualquer coisa a mais enviada na requisição)
  const data: Record<string, unknown> = {};
  for (const f of event.registrationFields) {
    let v = body.registration_data[f.fieldName];
    if (typeof v === "string") v = v.trim();
    if (v === undefined || v === null || v === "") {
      if (f.isRequired) return error(`Preencha o campo: ${f.fieldLabel}`);
      continue;
    }
    if (f.fieldType === "checkbox" && f.isRequired && v !== "Sim" && v !== true) return error(`Marque o campo: ${f.fieldLabel}`);
    if (f.fieldType === "rating" && !/^[0-5]$/.test(String(v))) return error(`Valor inválido em: ${f.fieldLabel}`);
    if (f.fieldType === "select" && f.fieldOptions.length && !f.fieldOptions.includes(String(v))) return error(`Opção inválida em: ${f.fieldLabel}`);
    if (f.fieldType === "email" && !z.string().email().safeParse(v).success) return error(`E-mail inválido em: ${f.fieldLabel}`);
    // Telefones sempre no mesmo formato: (49) 99199-0484
    data[f.fieldName] = isPhoneFieldType(f.fieldType) && typeof v === "string" ? formatPhoneBR(v) : v;
  }

  const registration = await prisma.eventRegistration.create({
    data: { eventId: id, registrationData: data as object },
    select: { id: true, createdAt: true },
  });

  after(() => alertAdminsAboutRegistration(registration.id, "new"));
  return json({ id: registration.id, created_at: registration.createdAt }, { status: 201 });
});
