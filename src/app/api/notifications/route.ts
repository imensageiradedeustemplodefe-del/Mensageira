import { prisma } from "@/lib/prisma";
import { handler, json } from "@/lib/api";
import { sanitizeName } from "@/lib/prayers";

export type NotificationType =
  | "daily_verse"
  | "new_photos"
  | "live_stream"
  | "new_testimony"
  | "new_prayer"
  | "event_today"
  | "live_starting_soon"
  | "custom";

export interface InAppNotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string | null;
  url: string | null;
  timestamp: string;
}

const NOTIFICATION_LIMIT = 20;

const config: Record<Exclude<NotificationType, "custom">, { title: string; icon: string; url: string }> = {
  daily_verse: { title: "📖 Nova Palavra do Dia", icon: "📖", url: "/" },
  new_photos: { title: "📸 Novas Fotos", icon: "📸", url: "/galeria" },
  live_stream: { title: "🔴 Transmissão ao Vivo", icon: "🔴", url: "/live" },
  new_testimony: { title: "✨ Novo Testemunho", icon: "✨", url: "/testemunhos" },
  new_prayer: { title: "🙏 Nova Oração", icon: "🙏", url: "/oracoes" },
  event_today: { title: "⛪ Hoje tem Culto!", icon: "⛪", url: "/eventos" },
  live_starting_soon: { title: "🔴 Live começando em breve!", icon: "🔴", url: "/live" },
};

const timeBR = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

// Builds the in-app notification feed (same rules as the original NotificationContext, now server-side).
export const GET = handler(async () => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const startOfDay = new Date(`${today}T00:00:00.000Z`);
  const endOfDay = new Date(`${today}T23:59:59.999Z`);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [todayEvents, streams, verses, albums, testimonies, prayers, customNotifs] = await Promise.all([
    prisma.event.findMany({
      where: { isPublished: true, eventDate: { gte: startOfDay, lte: endOfDay } },
      orderBy: { eventDate: "asc" },
      select: { id: true, title: true, eventDate: true, category: true },
    }),
    prisma.liveStream.findMany({
      where: { isActive: true },
      orderBy: { scheduledAt: "asc" },
      select: { id: true, title: true, scheduledAt: true, isLive: true },
    }),
    prisma.dailyVerse.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, verseReference: true },
    }),
    prisma.galleryAlbum.findMany({
      where: { isPublished: true, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.testimony.findMany({
      where: { isApproved: true, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.prayerRequest.findMany({
      where: { isApproved: true, allowPublicShare: true, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.customNotification.findMany({
      where: { isActive: true, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const all: InAppNotificationDTO[] = [];

  for (const event of todayEvents) {
    const c = config.event_today;
    all.push({
      id: `event_today_${event.id}_${today}`,
      type: "event_today",
      title: c.title,
      message:
        event.category === "culto"
          ? `Hoje tem culto às ${timeBR(event.eventDate)}!`
          : `${event.title} - Hoje às ${timeBR(event.eventDate)}`,
      icon: c.icon,
      url: c.url,
      timestamp: event.eventDate.toISOString(),
    });
  }

  for (const stream of streams) {
    if (stream.isLive) {
      const c = config.live_stream;
      all.push({
        id: `live_now_${stream.id}`,
        type: "live_stream",
        title: "🔴 AO VIVO AGORA!",
        message: `${stream.title} - Assista agora!`,
        icon: c.icon,
        url: c.url,
        timestamp: (stream.scheduledAt ?? now).toISOString(),
      });
    } else if (stream.scheduledAt) {
      const minutesUntil = Math.round((stream.scheduledAt.getTime() - now.getTime()) / 60000);
      if (minutesUntil > 0 && minutesUntil <= 120) {
        const c = config.live_starting_soon;
        const timeMessage = minutesUntil < 60 ? `Começa em ${minutesUntil} minutos!` : `Começa em ${Math.floor(minutesUntil / 60)}h`;
        all.push({
          id: `live_soon_${stream.id}_${today}`,
          type: "live_starting_soon",
          title: c.title,
          message: `${stream.title} - ${timeMessage}`,
          icon: c.icon,
          url: c.url,
          timestamp: stream.scheduledAt.toISOString(),
        });
      }
    }
  }

  if (verses.length > 0) {
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const seed = dayOfYear + now.getFullYear() * 365;
    const todayVerse = verses[seed % verses.length];
    const c = config.daily_verse;
    all.push({
      id: `daily_verse_${today}`,
      type: "daily_verse",
      title: c.title,
      message: `${todayVerse.verseReference} - Confira a palavra de hoje!`,
      icon: c.icon,
      url: c.url,
      timestamp: now.toISOString(),
    });
  }

  for (const album of albums) {
    const c = config.new_photos;
    all.push({
      id: `album_${album.id}`,
      type: "new_photos",
      title: c.title,
      message: `Novo álbum: ${album.name}`,
      icon: c.icon,
      url: c.url,
      timestamp: album.createdAt.toISOString(),
    });
  }

  for (const t of testimonies) {
    const c = config.new_testimony;
    all.push({
      id: `testimony_${t.id}`,
      type: "new_testimony",
      title: c.title,
      message: `Novo testemunho de ${t.name}`,
      icon: c.icon,
      url: c.url,
      timestamp: t.createdAt.toISOString(),
    });
  }

  for (const p of prayers) {
    const c = config.new_prayer;
    all.push({
      id: `prayer_${p.id}`,
      type: "new_prayer",
      title: c.title,
      message: `Novo pedido de ${sanitizeName(p.name)}`,
      icon: c.icon,
      url: c.url,
      timestamp: p.createdAt.toISOString(),
    });
  }

  for (const n of customNotifs) {
    all.push({
      id: `custom_${n.id}`,
      type: "custom",
      title: n.title,
      message: n.message,
      icon: n.icon,
      url: n.url,
      timestamp: n.createdAt.toISOString(),
    });
  }

  const unique = Array.from(new Map(all.map((n) => [n.id, n])).values());
  unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return json(unique.slice(0, NOTIFICATION_LIMIT));
});
