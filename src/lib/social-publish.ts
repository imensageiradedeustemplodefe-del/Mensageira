// Publicar as artes do painel (Artes para redes) no Facebook e no Instagram: feed, story e carrossel,
// na hora ou agendado. Usa a mesma conexão com a Meta da publicação automática dos eventos (lib/social).
import { prisma } from "@/lib/prisma";
import { sendPushToAdmins } from "@/lib/push";
import { graph, instagramUserId, sleep, socialConfigured } from "@/lib/social";

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
  return /fetch failed|timeout|aborted/i.test(msg) ? "sem resposta da Meta, tente de novo" : msg;
};

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

/** Publica o que estava agendado e já chegou a hora (chamado pelo agendador a cada poucos minutos e pelo cron diário). */
export async function publishDuePublications() {
  // publicação que ficou presa em "publicando" (a função caiu no meio): marca como erro para a equipe ver
  await prisma.socialPublication.updateMany({
    where: { status: "publicando", publishAt: { lt: new Date(Date.now() - 15 * 60_000) } },
    data: { status: "erro", result: "a publicação foi interrompida; confira nas redes e publique de novo se precisar" },
  });
  const due = await prisma.socialPublication.findMany({
    where: { status: "agendado", publishAt: { lte: new Date() } },
    orderBy: { publishAt: "asc" },
    take: 3,
    select: { id: true },
  });
  const done = [];
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
