import { prisma } from "@/lib/prisma";
import { handler, json, error } from "@/lib/api";
import { sendPushToAll } from "@/lib/push";

// Vercel Cron (see vercel.json): sends the daily verse and "today's events" push notifications.
// Mirrors the original `notify_todays_events` DB function.
export const GET = handler(async (req) => {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return error("Não autorizado", 401);
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const results: Record<string, unknown> = {};

  // Palavra do dia
  const verses = await prisma.dailyVerse.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  if (verses.length > 0) {
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const verse = verses[(dayOfYear + now.getFullYear() * 365) % verses.length];
    results.verse = await sendPushToAll({
      title: "📖 Palavra do Dia",
      body: `${verse.verseReference} — "${verse.verseText.slice(0, 120)}${verse.verseText.length > 120 ? "…" : ""}"`,
      url: "/",
      tag: `daily_verse_${today}`,
    });
  }

  // Eventos de hoje
  const events = await prisma.event.findMany({
    where: {
      isPublished: true,
      eventDate: { gte: new Date(`${today}T00:00:00.000Z`), lte: new Date(`${today}T23:59:59.999Z`) },
    },
    orderBy: { eventDate: "asc" },
  });
  results.events = [];
  for (const event of events) {
    const time = event.eventDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
    (results.events as unknown[]).push(
      await sendPushToAll({
        title: event.category === "culto" ? "⛪ Hoje tem Culto!" : `⛪ ${event.title}`,
        body: `${event.title} — hoje às ${time}${event.location ? ` • ${event.location}` : ""}`,
        url: "/eventos",
        tag: `event_today_${event.id}`,
      })
    );
  }

  return json({ ok: true, ...results });
});
