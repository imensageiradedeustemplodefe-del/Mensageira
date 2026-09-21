import { prisma } from "@/lib/prisma";
import { sendPushToAll } from "@/lib/push";

/**
 * Envio diário: versículo do dia + eventos de hoje.
 * Usado pelo cron da Vercel (/api/cron/daily) e pelo botão "Enviar agora" do painel.
 * As datas são calculadas no fuso de Brasília.
 */
export async function runDailyNotifications(source = "cron") {
  const now = new Date();
  const today = brDate(now); // yyyy-MM-dd em Brasília
  const results: Record<string, unknown> = {};

  // Palavra do dia (rotaciona pela lista de versículos ativos)
  const verses = await prisma.dailyVerse.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  if (verses.length > 0) {
    const [y, m, d] = today.split("-").map(Number);
    const dayOfYear = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
    const verse = verses[(dayOfYear + y * 365) % verses.length];
    results.verse = await sendPushToAll(
      {
        title: "📖 Palavra do Dia",
        body: `${verse.verseReference} — "${verse.verseText.slice(0, 120)}${verse.verseText.length > 120 ? "…" : ""}"`,
        url: "/",
        tag: `daily_verse_${today}`,
      },
      source
    );
  }

  // Eventos de hoje (dia civil de Brasília = 03:00Z de hoje até 03:00Z de amanhã)
  const start = new Date(`${today}T03:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  const events = await prisma.event.findMany({
    where: { isPublished: true, eventDate: { gte: start, lt: end } },
    orderBy: { eventDate: "asc" },
  });
  const eventResults: unknown[] = [];
  for (const event of events) {
    const time = event.eventDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
    eventResults.push(
      await sendPushToAll(
        {
          title: event.category === "culto" ? "⛪ Hoje tem Culto!" : `⛪ ${event.title}`,
          body: `${event.title} — hoje às ${time}${event.location ? ` • ${event.location}` : ""}`,
          url: "/eventos",
          tag: `event_today_${event.id}`,
        },
        source
      )
    );
  }
  results.events = eventResults;

  // Aniversário da igreja (fundada em 21/09/2013): todo ano, no dia 21/09
  if (today.slice(5) === ANNIVERSARY_MM_DD) {
    const founded = await foundedYear();
    const years = Number(today.slice(0, 4)) - founded;
    results.anniversary = await sendPushToAll(
      {
        title: `🎂 ${years} anos da Mensageira de Deus!`,
        body: `Hoje, 21 de setembro, nossa igreja completa ${years} anos proclamando a Palavra de Deus com fé e amor. Glória a Deus por cada vida alcançada! Venha celebrar conosco.`,
        url: "/sobre",
        tag: `anniversary_${today.slice(0, 4)}`,
      },
      source
    );
  }

  results.date = today;
  return results;
}

const ANNIVERSARY_MM_DD = "09-21";
const DEFAULT_FOUNDED_YEAR = 2013;

async function foundedYear() {
  const setting = await prisma.siteSetting.findUnique({ where: { settingKey: "church_founded_year" } });
  const year = Number(setting?.settingValue);
  return Number.isInteger(year) && year > 1900 ? year : DEFAULT_FOUNDED_YEAR;
}

function brDate(d: Date) {
  // "sv-SE" formata como yyyy-MM-dd
  return d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}
