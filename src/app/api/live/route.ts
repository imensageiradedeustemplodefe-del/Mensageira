import { prisma } from "@/lib/prisma";
import { handler, json } from "@/lib/api";
import { snake } from "@/lib/case";
import { getChannelId, getChannelLive } from "@/lib/youtube-live";

export const GET = handler(async () => {
  const streams = snake(
    await prisma.liveStream.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    })
  ) as Record<string, unknown>[];

  // Nenhuma transmissão marcada "ao vivo" no painel? Verifica o canal do YouTube automaticamente.
  if (!streams.some((s) => s.is_live)) {
    const channelId = await getChannelId();
    const yt = await getChannelLive(channelId);
    if (yt.live && yt.videoId) {
      const now = new Date().toISOString();
      streams.unshift({
        id: `youtube-${yt.videoId}`,
        title: yt.title ?? "Culto ao vivo",
        description: null,
        platform: "youtube",
        stream_url: `https://www.youtube.com/watch?v=${yt.videoId}`,
        embed_url: `https://www.youtube.com/embed/${yt.videoId}?autoplay=1`,
        thumbnail_url: `https://i.ytimg.com/vi/${yt.videoId}/hqdefault_live.jpg`,
        is_live: true,
        is_active: true,
        chat_enabled: true,
        viewer_count: null,
        scheduled_at: null,
        started_at: now,
        ended_at: null,
        created_at: now,
        updated_at: now,
        auto_detected: true,
      });
    }
  }

  return json(streams);
});
