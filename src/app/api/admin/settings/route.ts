import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { error, handler, json, parseBody, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";

// Configurações que a equipe de mídia pode ver e mudar (ligação da galeria com o Google Drive)
const MIDIA_KEYS = ["google_drive_script_url", "google_drive_folder_id"];

// Todas as configurações, inclusive URLs de integração (admin); a mídia só recebe as da galeria.
export const GET = handler(async () => {
  const session = await requireAdmin();
  const settings = await prisma.siteSetting.findMany({
    where: session.user.role === "admin" ? {} : { settingKey: { in: MIDIA_KEYS } },
    orderBy: [{ category: "asc" }, { displayName: "asc" }],
  });
  return json(snake(settings));
});

// Bulk update: { settings: [{ setting_key, setting_value }] }
export const PUT = handler(async (req) => {
  const session = await requireAdmin();
  const { settings } = await parseBody(
    req,
    z.object({
      settings: z.array(z.object({ setting_key: z.string().min(1), setting_value: z.string().nullable() })),
    })
  );
  if (session.user.role !== "admin" && settings.some((s) => !MIDIA_KEYS.includes(s.setting_key))) {
    return error("Seu usuário só pode alterar a ligação da galeria com o Google Drive", 403);
  }
  await prisma.$transaction(
    settings.map((s) =>
      prisma.siteSetting.updateMany({ where: { settingKey: s.setting_key }, data: { settingValue: s.setting_value } })
    )
  );
  return json({ success: true, updated: settings.length });
});
