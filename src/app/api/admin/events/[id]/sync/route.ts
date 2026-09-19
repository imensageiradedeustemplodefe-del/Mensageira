import { handler, json, param, requireAdmin } from "@/lib/api";
import { syncEventRegistrations } from "@/lib/sheets";

type Ctx = { params: Promise<{ id: string }> };

// Sends pending registrations to the Google Sheets Apps Script.
export const POST = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const eventId = await param(ctx, "id");
  const result = await syncEventRegistrations(eventId);
  return json(result);
});
