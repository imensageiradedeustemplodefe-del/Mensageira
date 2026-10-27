import { handler, json, error } from "@/lib/api";
import { runDailyNotifications } from "@/lib/daily-notifications";
import { isCronAuthorized } from "@/lib/cron-auth";
import { cleanupRateLimits } from "@/lib/rate-limit";
import { cleanupExpiredSubscriptions } from "@/lib/push";
import { publishDuePublications } from "@/lib/social-publish";

export const maxDuration = 60;

// Vercel Cron (see vercel.json): sends the daily verse and "today's events" push notifications.
export const GET = handler(async (req) => {
  // Aceita o segredo do cron da Vercel (header) ou a chave do agendador externo (header ou ?key=)
  if (!isCronAuthorized(req)) return error("Não autorizado", 401);
  const results = await runDailyNotifications("cron");
  await cleanupRateLimits();
  const expiredRemoved = await cleanupExpiredSubscriptions().catch(() => 0);
  // reserva: se o agendador de poucos em poucos minutos falhar, o que estava agendado sai aqui
  const published = await publishDuePublications({ force: true }).catch((err) => [{ error: String(err) }]);
  return json({ ok: true, ...results, published, expiredRemoved });
});
