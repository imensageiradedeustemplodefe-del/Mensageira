import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, parseBody, requireAdmin } from "@/lib/api";
import { AUTO_EVENTS_KEY, autoEventsEnabled } from "@/lib/social";

// Publicação automática dos eventos do dia às 7h no Facebook e no Instagram: ligar ou pausar (admin e mídia).
export const GET = handler(async () => {
  await requireAdmin();
  return json({ enabled: await autoEventsEnabled() });
});

export const PUT = handler(async (req) => {
  const session = await requireAdmin();
  const { enabled } = await parseBody(req, z.object({ enabled: z.boolean() }));
  const value = enabled ? "on" : "off";
  await prisma.siteSetting.upsert({
    where: { settingKey: AUTO_EVENTS_KEY },
    update: { settingValue: value, description: `Alterado por ${session.user.username || session.user.name || "equipe"}` },
    create: {
      settingKey: AUTO_EVENTS_KEY,
      settingValue: value,
      settingType: "text",
      category: "system",
      displayName: "Publicar eventos do dia nas redes (7h)",
      description: `Alterado por ${session.user.username || session.user.name || "equipe"}`,
    },
  });
  return json({ enabled });
});
