import { prisma } from "@/lib/prisma";
import { handler, json } from "@/lib/api";

// Public site settings. Integration URLs (Apps Script etc.) are never exposed here.
export const GET = handler(async () => {
  const settings = await prisma.siteSetting.findMany({
    where: { category: { not: "integrations" } },
    select: { settingKey: true, settingValue: true },
  });
  return json(settings.map((s) => ({ setting_key: s.settingKey, setting_value: s.settingValue })));
});
