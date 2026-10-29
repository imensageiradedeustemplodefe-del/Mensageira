// Publicar as artes do painel (Artes para redes) no Facebook e no Instagram: feed, story e carrossel,
// na hora ou agendado. Usa a mesma conexão com a Meta da publicação automática dos eventos (lib/social).
import { prisma } from "@/lib/prisma";
import { sendPushToAdmins } from "@/lib/push";
import { graph, instagramUserId, sleep, socialConfigured } from "@/lib/social";
import { after } from "next/server";
import { publicCache, refreshPublicData } from "@/lib/public-cache";

const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://imensageiradedeus.com.br").replace(/\/$/, "");

export const PUBLICATION_KINDS = ["feed", "story", "carrossel"] as const;
export type PublicationKind = (typeof PUBLICATION_KINDS)[number];
export const NETWORKS = ["facebook", "instagram"] as const;
export type Network = (typeof NETWORKS)[number];

export const publicationSelect = {
  id: true,
  title: true,
  kind: true,
  images: true,
  caption: true,
  networks: true,
  publishAt: true,
  status: true,
  result: true,
  publishedAt: true,
  createdBy: true,
} as const;

const pageId = () => process.env.META_PAGE_ID!.trim();
const abs = (url: string) => (url.startsWith("http") ? url : `${ORIGIN}${url}`);

/** Espera o Instagram terminar de processar um contêiner de mídia. */
async function waitReady(creationId: string) {
  for (let i = 0; i < 15; i++) {
    const { status_code } = await graph<{ status_code?: string }>(creationId, { fields: "status_code" }, "GET");
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR" || status_code === "EXPIRED") throw new Error("o Instagram não conseguiu processar a imagem");
    await sleep(2000);
  }
  throw new Error("o Instagram demorou demais para processar a imagem");
}

async function toFacebook(kind: PublicationKind, images: string[], caption: string) {
  if (kind === "story") {
    const { id } = await graph<{ id: string }>(`${pageId()}/photos`, { url: abs(images[0]), published: "false" });
    await graph(`${pageId()}/photo_stories`, { photo_id: id });
    return;
  }
  if (images.length === 1) {
    await graph(`${pageId()}/photos`, { url: abs(images[0]), caption });
    return;
  }
  // várias fotos num post só: sobe cada uma sem publicar e junta no post
  const ids: string[] = [];
  for (const url of images) ids.push((await graph<{ id: string }>(`${pageId()}/photos`, { url: abs(url), published: "false" })).id);
  const attached = Object.fromEntries(ids.map((id, i) => [`attached_media[${i}]`, JSON.stringify({ media_fbid: id })]));
  await graph(`${pageId()}/feed`, { message: caption, ...attached });
}

async function toInstagram(kind: PublicationKind, images: string[], caption: string) {
  const ig = await instagramUserId();
  let creationId: string;
  if (kind === "story") {
    creationId = (await graph<{ id: string }>(`${ig}/media`, { image_url: abs(images[0]), media_type: "STORIES" })).id;
  } else if (images.length === 1) {
    creationId = (await graph<{ id: string }>(`${ig}/media`, { image_url: abs(images[0]), caption })).id;
  } else {
    const children: string[] = [];
    for (const url of images) {
      const { id } = await graph<{ id: string }>(`${ig}/media`, { image_url: abs(url), is_carousel_item: "true" });
      await waitReady(id);
      children.push(id);
    }
    creationId = (await graph<{ id: string }>(`${ig}/media`, { media_type: "CAROUSEL", children: children.join(","), caption })).id;
  }
  await waitReady(creationId);
  await graph(`${ig}/media_publish`, { creation_id: creationId });
}

const errText = (err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  if (/fetch failed|timeout|aborted/i.test(msg)) return "sem resposta da Meta, tente de novo";
  if (/access token|session has expired|OAuthException/i.test(msg))
    return "o token da Meta venceu ou é inválido: o administrador precisa gerar o token da PÁGINA que não expira e trocar o META_PAGE_TOKEN na Vercel";
  return msg;
};

/** Confere se o token da Meta está funcionando (nome da página), para o painel avisar antes de publicar. */
export async function checkConnection(): Promise<{ ok: boolean; page?: string; error?: string }> {
  if (!socialConfigured()) return { ok: false, error: "não configurada" };
  try {
    const r = await graph<{ name?: string }>(pageId(), { fields: "name" }, "GET");
    return { ok: true, page: r.name };
  } catch (err) {
    return { ok: false, error: errText(err) };
  }
}

/** Publica de novo uma publicação que deu erro; na "publicado em parte", só nas redes que falharam. */
export async function retryPublication(id: string) {
  const pub = await prisma.socialPublication.findUnique({ where: { id } });
  if (!pub || (pub.status !== "erro" && pub.status !== "parcial")) return null;
  const failed = pub.status === "parcial" ? (pub.networks as Network[]).filter((n) => new RegExp(`${n === "facebook" ? "Facebook" : "Instagram"}: erro`).test(pub.result ?? "")) : pub.networks;
  await prisma.socialPublication.update({ where: { id }, data: { status: "agendado", networks: failed.length ? failed : pub.networks, publishAt: new Date(), result: null } });
  return runPublication(id);
}

/** Publica agora uma publicação já gravada e guarda o resultado (uma rede pode dar certo e a outra não). */
export async function runPublication(id: string) {
  // só quem conseguir trocar "agendado" por "publicando" publica (o agendador pode rodar duas vezes ao mesmo tempo)
  const claimed = await prisma.socialPublication.updateMany({ where: { id, status: "agendado" }, data: { status: "publicando" } });
  if (!claimed.count) return null;
  const pub = await prisma.socialPublication.findUniqueOrThrow({ where: { id } });
  const kind = pub.kind as PublicationKind;
  const results: string[] = [];
  let ok = 0;
  if (!socialConfigured()) {
    results.push("conexão com a Meta não configurada");
  } else {
    for (const net of pub.networks as Network[]) {
      try {
        await (net === "facebook" ? toFacebook : toInstagram)(kind, pub.images, pub.caption);
        results.push(`${net === "facebook" ? "Facebook" : "Instagram"}: publicado`);
        ok++;
      } catch (err) {
        results.push(`${net === "facebook" ? "Facebook" : "Instagram"}: erro (${errText(err)})`);
      }
    }
  }
  const status = ok === pub.networks.length ? "publicado" : ok > 0 ? "parcial" : "erro";
  const row = await prisma.socialPublication.update({
    where: { id },
    data: { status, result: results.join(" • "), publishedAt: ok ? new Date() : null },
    select: publicationSelect,
  });
  return row;
}

// O agendador roda a cada poucos minutos e o banco cobra por consulta (cota mensal do plano grátis):
// o horário do próximo agendamento fica em cache, e só se consulta o banco quando ele chegou.
// Agendar ou cancelar pelo painel limpa o cache (toda alteração em /api/admin limpa).
const nextScheduledAt = publicCache("next-publication", 6 * 3600, async () => {
  const next = await prisma.socialPublication.findFirst({ where: { status: { in: ["agendado", "publicando"] } }, orderBy: { publishAt: "asc" }, select: { publishAt: true } });
  return next?.publishAt.toISOString() ?? null;
});

const LATE_LIMIT_MS = 6 * 3600_000;

/**
 * Dispara o agendador depois de responder (sem atrasar a resposta). Chamado por rotas acessadas com
 * frequência (menu do painel a cada minuto, notificações do site), além do agendador externo: assim o
 * agendado sai na hora mesmo se o agendador externo falhar. Sem nada vencido, só lê o cache.
 */
export function kickScheduler() {
  try {
    after(() => publishDuePublications().catch((err) => console.error("[agendador]", err)));
  } catch {
    /* fora de uma requisição */
  }
}

/**
 * Publica o que estava agendado e já chegou a hora. O agendador de poucos em poucos minutos só olha o cache;
 * o cron diário passa `force` e confere o banco de verdade.
 */
export async function publishDuePublications({ force = false } = {}) {
  if (!force) {
    const next = await nextScheduledAt();
    if (!next || new Date(next).getTime() > Date.now()) return [];
  }
  // publicação que ficou presa em "publicando" (a função caiu no meio): marca como erro para a equipe ver
  await prisma.socialPublication.updateMany({
    where: { status: "publicando", publishAt: { lt: new Date(Date.now() - 15 * 60_000) } },
    data: { status: "erro", result: "a publicação foi interrompida; confira nas redes e publique de novo se precisar" },
  });
  // atrasou demais (o agendador não passou na hora): não publica sozinho conteúdo vencido ("Hoje tem culto"
  // de madrugada); vira erro e a equipe decide com "Tentar de novo"
  const late = await prisma.socialPublication.updateMany({
    where: { status: "agendado", publishAt: { lt: new Date(Date.now() - LATE_LIMIT_MS) } },
    data: { status: "erro", result: "não saiu no horário (o agendador não rodou a tempo); use “Tentar de novo” se ainda fizer sentido publicar" },
  });
  if (late.count) refreshPublicData();
  const due = await prisma.socialPublication.findMany({
    where: { status: "agendado", publishAt: { lte: new Date() } },
    orderBy: { publishAt: "asc" },
    take: 3,
    select: { id: true },
  });
  const done = [];
  if (due.length) refreshPublicData(); // o próximo agendamento muda
  for (const { id } of due) {
    const row = await runPublication(id);
    if (!row) continue;
    done.push({ id, status: row.status });
    await sendPushToAdmins({
      title: row.status === "publicado" ? "📣 Publicado nas redes" : "⚠️ Publicação agendada com problema",
      body: `${row.title} — ${row.result ?? ""}`.slice(0, 240),
      url: "/admin?tab=art",
      tag: `pub-${id}`,
    });
  }
  return done;
}
