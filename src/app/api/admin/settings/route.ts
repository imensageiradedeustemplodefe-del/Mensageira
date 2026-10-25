import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, parseBody, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";
import { CONTENT_KEYS, LIST_KEYS, contentLabel, type ListKey } from "@/lib/site-content";

// Todas as configurações, inclusive URLs de integração (só admin: /api/admin/settings não é liberado a outros papéis).
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
      settings: z.array(z.object({ setting_key: z.string().min(1).max(100), setting_value: z.string().max(100_000).nullable() })),
    })
  );
  // Textos e listas do conteúdo do site ainda sem linha no banco: cria (só as chaves conhecidas)
  const existing = new Set(
    (await prisma.siteSetting.findMany({ where: { settingKey: { in: settings.map((s) => s.setting_key) } }, select: { settingKey: true } })).map(
      (s) => s.settingKey,
    ),
  );
  const toCreate = settings.filter((s) => !existing.has(s.setting_key) && CONTENT_KEYS.has(s.setting_key));
  await prisma.$transaction([
    ...settings
      .filter((s) => existing.has(s.setting_key))
      .map((s) => prisma.siteSetting.updateMany({ where: { settingKey: s.setting_key }, data: { settingValue: s.setting_value } })),
    ...toCreate.map((s) =>
      prisma.siteSetting.create({
        data: {
          settingKey: s.setting_key,
          settingValue: s.setting_value,
          settingType: LIST_KEYS.includes(s.setting_key as ListKey) ? "json" : "text",
          category: "content",
          displayName: contentLabel(s.setting_key),
        },
      }),
    ),
  ]);
  return json({ success: true, updated: settings.length });
});
