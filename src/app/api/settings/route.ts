import { prisma } from "@/lib/prisma";
import { handler, json } from "@/lib/api";
import { publicCache } from "@/lib/public-cache";

// Public site settings. Integration URLs (Apps Script etc.) are never exposed here.
const getSettings = publicCache("settings", 600, async () => {
  const settings = await prisma.siteSetting.findMany({
    where: { category: { not: "integrations" } },
    select: { settingKey: true, settingValue: true },
  });
  return settings.map((s) => ({ setting_key: s.settingKey, setting_value: s.settingValue }));
});

export const GET = handler(async () => json(await getSettings()));
