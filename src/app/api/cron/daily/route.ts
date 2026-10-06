import { handler, json, error } from "@/lib/api";
import { runDailyNotifications } from "@/lib/daily-notifications";

export const maxDuration = 60;

// Vercel Cron (see vercel.json): sends the daily verse and "today's events" push notifications.
export const GET = handler(async (req) => {
  // Aceita o segredo do cron da Vercel (header) ou a chave do agendador externo (header ou ?key=)
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  const vercelOk = !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  const external = process.env.CRON_EXTERNAL_KEY;
  const externalOk = !!external && (auth === `Bearer ${external}` || key === external);
  if (!vercelOk && !externalOk) {
    return error("Não autorizado", 401);
  }
  const results = await runDailyNotifications("cron");
  return json({ ok: true, ...results });
});
