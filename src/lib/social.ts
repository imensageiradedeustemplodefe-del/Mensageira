// Publicação automática dos eventos do dia na página do Facebook e no Instagram da igreja (API oficial da Meta).
// Configuração (variáveis de ambiente na Vercel):
//   META_PAGE_ID      id da página do Facebook
//   META_PAGE_TOKEN   token de acesso da página (permissões pages_manage_posts, instagram_content_publish)
//   META_IG_USER_ID   opcional: id da conta profissional do Instagram (se vazio, é descoberto pela página)
import { prisma } from "@/lib/prisma";
import { sendPushToAdmins } from "@/lib/push";
import { shareEvent } from "@/lib/share";

const GRAPH = `${process.env.META_GRAPH_URL ?? "https://graph.facebook.com"}/${process.env.META_GRAPH_VERSION ?? "v24.0"}`;
const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://imensageiradedeus.com.br").replace(/\/$/, "");

export const socialConfigured = () => !!process.env.META_PAGE_ID?.trim() && !!process.env.META_PAGE_TOKEN?.trim();

export async function graph<T>(path: string, params: Record<string, string>, method: "GET" | "POST" = "POST"): Promise<T> {
  const body = new URLSearchParams({ ...params, access_token: process.env.META_PAGE_TOKEN!.trim() });
  const res = await fetch(method === "GET" ? `${GRAPH}/${path}?${body}` : `${GRAPH}/${path}`, {
    method,
    body: method === "POST" ? body : undefined,
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok || data.error) throw new Error(data.error?.message ?? `Erro ${res.status} da Meta`);
  return data;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function instagramUserId() {
  const fromEnv = process.env.META_IG_USER_ID?.trim();
  if (fromEnv) return fromEnv;
  const page = await graph<{ instagram_business_account?: { id: string } }>(process.env.META_PAGE_ID!.trim(), { fields: "instagram_business_account" }, "GET");
  if (!page.instagram_business_account?.id) throw new Error("o Instagram não está ligado à página do Facebook (ou não é conta profissional)");
  return page.instagram_business_account.id;
}

async function postInstagram(imageUrl: string, caption: string) {
  const ig = await instagramUserId();
  const { id: creationId } = await graph<{ id: string }>(`${ig}/media`, { image_url: imageUrl, caption });
  // o Instagram processa a imagem antes de publicar
  for (let i = 0; i < 10; i++) {
    const { status_code } = await graph<{ status_code?: string }>(creationId, { fields: "status_code" }, "GET");
    if (status_code === "FINISHED") break;
    if (status_code === "ERROR" || status_code === "EXPIRED") throw new Error("o Instagram não conseguiu processar a imagem");
    await sleep(2000);
  }
  await graph(`${ig}/media_publish`, { creation_id: creationId });
}

/** Texto do post: o mesmo do compartilhamento, sem a marcação de negrito do WhatsApp. */
function caption(event: {
  id: string;
  title: string;
  eventDate: Date;
  location: string | null;
  description: string | null;
  registrationRequired: boolean;
  registrationsClosed: boolean;
  registrationsCloseAt: Date | null;
  contributionCents: number | null;
  contributionNote: string | null;
  contributionsClosed: boolean;
  contributionsCloseAt: Date | null;
}) {
  const share = shareEvent({
    id: event.id,
    title: event.title,
    event_date: event.eventDate.toISOString(),
    location: event.location,
    description: event.description,
    registration_required: event.registrationRequired,
    registrations_closed: event.registrationsClosed,
    registrations_close_at: event.registrationsCloseAt,
    contribution_cents: event.contributionCents,
    contribution_note: event.contributionNote,
    contributions_closed: event.contributionsClosed,
    contributions_close_at: event.contributionsCloseAt,
  });
  return `${share.text.replace(/\*/g, "")}\n\n👉 ${share.url}`;
}

/**
 * Publica os eventos de hoje no Facebook e no Instagram (uma vez por evento) e avisa os celulares da equipe
 * ("Avisar este aparelho" no painel) do resultado.
 */
export async function publishTodayEventsToSocial(events: Parameters<typeof caption>[0][]) {
  if (!socialConfigured() || events.length === 0) return { skipped: !socialConfigured() ? "não configurado" : "sem eventos" };
  const results: Record<string, { facebook: string; instagram: string }> = {};

  for (const event of events) {
    // nunca publica o mesmo evento duas vezes (o cron pode rodar de novo)
    const done = await prisma.pushLog.findFirst({ where: { source: "social", title: event.id } });
    if (done) continue;

    const text = caption(event);
    const imageUrl = `${ORIGIN}/api/social/event-image/${event.id}`;
    const r = { facebook: "ok", instagram: "ok" };
    try {
      await graph(`${process.env.META_PAGE_ID!.trim()}/photos`, { url: imageUrl, caption: text });
    } catch (err) {
      r.facebook = err instanceof Error ? err.message : String(err);
    }
    try {
      await postInstagram(imageUrl, text);
    } catch (err) {
      r.instagram = err instanceof Error ? err.message : String(err);
    }
    results[event.id] = r;

    const okAll = r.facebook === "ok" && r.instagram === "ok";
    const okNone = r.facebook !== "ok" && r.instagram !== "ok";
    await prisma.pushLog.create({
      data: { source: "social", title: event.id, body: `facebook: ${r.facebook} | instagram: ${r.instagram}`, sent: okNone ? 0 : 1, failed: okAll ? 0 : 1 },
    });
    await sendPushToAdmins(
      okAll
        ? { title: "📣 Publicado nas redes", body: `${event.title} foi publicado no Facebook e no Instagram.`, url: `/eventos/${event.id}`, tag: `social-${event.id}` }
        : {
            title: okNone ? "⚠️ Publicação nas redes falhou" : "⚠️ Publicação nas redes incompleta",
            body: `${event.title} — Facebook: ${r.facebook === "ok" ? "publicado" : `erro (${r.facebook})`} • Instagram: ${
              r.instagram === "ok" ? "publicado" : `erro (${r.instagram})`
            }`.slice(0, 240),
            url: "/admin",
            tag: `social-${event.id}`,
          }
    );
  }
  return results;
}
