// Detecta automaticamente se o canal da igreja está AO VIVO no YouTube.
// Quando há transmissão, o endereço /channel/<id>/live aponta (canonical) para o vídeo ao vivo e a
// página contém "isLiveNow":true. Não precisa de chave de API. Resultado em cache por 60 s.
import { prisma } from "@/lib/prisma";

export const DEFAULT_CHANNEL_ID = "UCqZ48-AJ0FipFnAcBlJ2FJw"; // @imensageiradedeustemlodefe

export interface ChannelLive {
  live: boolean;
  videoId?: string;
  title?: string;
}

export async function getChannelId() {
  const setting = await prisma.siteSetting.findUnique({ where: { settingKey: "youtube_channel_id" } });
  const id = setting?.settingValue?.trim();
  return id && /^UC[\w-]{20,}$/.test(id) ? id : DEFAULT_CHANNEL_ID;
}

export async function getChannelLive(channelId: string): Promise<ChannelLive> {
  try {
    const res = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "pt-BR" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { live: false };
    const html = await res.text();
    const canonical = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/);
    if (!canonical || !html.includes('"isLiveNow":true')) return { live: false };
    const title = html.match(/<meta name="title" content="([^"]*)"/)?.[1];
    return { live: true, videoId: canonical[1], title: title ? decodeEntities(title) : undefined };
  } catch {
    return { live: false };
  }
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
