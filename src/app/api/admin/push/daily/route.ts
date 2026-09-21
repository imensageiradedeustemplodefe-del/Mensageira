import { handler, json, requireAdmin } from "@/lib/api";
import { runDailyNotifications } from "@/lib/daily-notifications";

export const maxDuration = 60;

// Dispara manualmente o envio diário (versículo + eventos de hoje)
export const POST = handler(async () => {
  await requireAdmin();
  const results = await runDailyNotifications("manual");
  return json({ success: true, ...results });
});
