import { prisma } from "@/lib/prisma";
import { snake } from "@/lib/case";

// Sends the unsynced registrations of an event to the Google Apps Script that
// manages the spreadsheets (see google-apps-script/EventRegistrations.gs).
export async function syncEventRegistrations(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { title: true } });
  if (!event) throw new Error("Evento não encontrado");

  const [fields, registrations, setting] = await Promise.all([
    prisma.eventRegistrationField.findMany({ where: { eventId }, orderBy: { fieldOrder: "asc" } }),
    prisma.eventRegistration.findMany({ where: { eventId, syncedToSheets: false } }),
    prisma.siteSetting.findUnique({ where: { settingKey: "event_registration_script_url" } }),
  ]);

  if (registrations.length === 0) {
    return { success: true, syncedCount: 0, message: "Nenhuma inscrição pendente de sincronização" };
  }

  const scriptUrl = setting?.settingValue?.trim();
  if (!scriptUrl) {
    throw new Error("Google Apps Script URL não configurado. Configure em Configurações do Site.");
  }

  const res = await fetch(scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventTitle: event.title,
      fields: snake(fields),
      registrations: snake(registrations),
    }),
  });

  if (!res.ok) throw new Error(`Apps Script respondeu ${res.status}. Verifique se a implantação está com acesso "Qualquer pessoa".`);
  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    throw new Error("O Apps Script de inscrições exigiu login do Google. Reimplante o script com acesso: Qualquer pessoa.");
  }
  const result = JSON.parse(text);
  if (!result.success) throw new Error(result.error || "Apps Script returned error");

  await prisma.eventRegistration.updateMany({
    where: { id: { in: registrations.map((r) => r.id) } },
    data: { spreadsheetId: result.spreadsheetId ?? null, syncedToSheets: true, syncedAt: new Date() },
  });

  return { success: true, spreadsheetId: result.spreadsheetId, syncedCount: registrations.length };
}
