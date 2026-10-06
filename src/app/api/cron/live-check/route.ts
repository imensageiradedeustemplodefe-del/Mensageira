import { prisma } from "@/lib/prisma";
import { handler, json, error } from "@/lib/api";
import { sendPushToAll } from "@/lib/push";
import { getChannelId, getChannelLive } from "@/lib/youtube-live";

export const maxDuration = 30;

// Chamado a cada poucos minutos pelo agendador externo (cron-job.org): se o canal entrou AO VIVO,
// avisa todo mundo por push — uma única vez por transmissão.
export const GET = handler(async (req) => {
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  const external = process.env.CRON_EXTERNAL_KEY;
  const ok =
    (!!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) ||
    (!!external && (auth === `Bearer ${external}` || key === external));
  if (!ok) return error("Não autorizado", 401);

  const yt = await getChannelLive(await getChannelId());
  if (!yt.live || !yt.videoId) return json({ live: false });

  const last = await prisma.siteSetting.findUnique({ where: { settingKey: "last_live_notified_video" } });
  if (last?.settingValue === yt.videoId) return json({ live: true, videoId: yt.videoId, notified: false, reason: "já avisado" });

  await prisma.siteSetting.upsert({
    where: { settingKey: "last_live_notified_video" },
    update: { settingValue: yt.videoId },
    create: { settingKey: "last_live_notified_video", settingValue: yt.videoId, settingType: "text", category: "system", displayName: "Última live avisada" },
  });
  const result = await sendPushToAll(
    { title: "🔴 AO VIVO AGORA!", body: `${yt.title ?? "Culto ao vivo"} — Assista agora!`, url: "/live", tag: `live_${yt.videoId}` },
    "live"
  );
  return json({ live: true, videoId: yt.videoId, notified: true, ...result });
});
