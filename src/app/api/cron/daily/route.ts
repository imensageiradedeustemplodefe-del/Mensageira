import { handler, json, error } from "@/lib/api";
import { runDailyNotifications } from "@/lib/daily-notifications";
import { isCronAuthorized } from "@/lib/cron-auth";
import { cleanupRateLimits } from "@/lib/rate-limit";

export const maxDuration = 60;

// Vercel Cron (see vercel.json): sends the daily verse and "today's events" push notifications.
export const GET = handler(async (req) => {
  // Aceita o segredo do cron da Vercel (header) ou a chave do agendador externo (header ou ?key=)
  if (!isCronAuthorized(req)) return error("Não autorizado", 401);
  const results = await runDailyNotifications("cron");
  await cleanupRateLimits();
  return json({ ok: true, ...results });
});
