import { prisma } from "@/lib/prisma";
import { handler, json, error } from "@/lib/api";
import { sendPushToAll } from "@/lib/push";
import { getChannelId, getChannelLive } from "@/lib/youtube-live";
import { isCronAuthorized } from "@/lib/cron-auth";
import { publishDuePublications } from "@/lib/social-publish";

// Chamado a cada poucos minutos pelo agendador externo (cron-job.org): se o canal entrou AO VIVO,
// avisa todo mundo por push — uma única vez por transmissão. Aproveita a passada para publicar
// nas redes as artes agendadas cujo horário chegou.
export const maxDuration = 60;

export const GET = handler(async (req) => {
  if (!isCronAuthorized(req)) return error("Não autorizado", 401);
  const published = await publishDuePublications().catch((err) => [{ error: String(err) }]);
  const res = await liveCheck().catch((err) => ({ live: false, error: String(err) }));
  return json({ ...res, published });
});

async function liveCheck() {
  const yt = await getChannelLive(await getChannelId());
  if (!yt.live || !yt.videoId) return { live: false };

  const last = await prisma.siteSetting.findUnique({ where: { settingKey: "last_live_notified_video" } });
  if (last?.settingValue === yt.videoId) return { live: true, videoId: yt.videoId, notified: false, reason: "já avisado" };

  await prisma.siteSetting.upsert({
    where: { settingKey: "last_live_notified_video" },
    update: { settingValue: yt.videoId },
    create: { settingKey: "last_live_notified_video", settingValue: yt.videoId, settingType: "text", category: "system", displayName: "Última live avisada" },
  });
  const result = await sendPushToAll(
    { title: "🔴 AO VIVO AGORA!", body: `${yt.title ?? "Culto ao vivo"} — Assista agora!`, url: "/live", tag: `live_${yt.videoId}` },
    "live"
  );
  return { live: true, videoId: yt.videoId, notified: true, ...result };
}
