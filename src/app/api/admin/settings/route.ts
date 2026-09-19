import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, parseBody, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";

// All settings, including integration URLs (admin only).
export const GET = handler(async () => {
  await requireAdmin();
  const settings = await prisma.siteSetting.findMany({ orderBy: [{ category: "asc" }, { displayName: "asc" }] });
  return json(snake(settings));
});

// Bulk update: { settings: [{ setting_key, setting_value }] }
export const PUT = handler(async (req) => {
  await requireAdmin();
  const { settings } = await parseBody(
    req,
    z.object({
      settings: z.array(z.object({ setting_key: z.string().min(1), setting_value: z.string().nullable() })),
    })
  );
  await prisma.$transaction(
    settings.map((s) =>
      prisma.siteSetting.updateMany({ where: { settingKey: s.setting_key }, data: { settingValue: s.setting_value } })
    )
  );
  return json({ success: true, updated: settings.length });
});
