import { handler, json, error } from "@/lib/api";
import { runDailyNotifications } from "@/lib/daily-notifications";

export const maxDuration = 60;

// Vercel Cron (see vercel.json): sends the daily verse and "today's events" push notifications.
export const GET = handler(async (req) => {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return error("Não autorizado", 401);
  }
  const results = await runDailyNotifications("cron");
  return json({ ok: true, ...results });
});
