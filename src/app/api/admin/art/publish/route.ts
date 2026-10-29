import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { error, handler, json, parseBody, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";
import { artSpecSchema } from "@/lib/art/spec";
import { renderArt } from "@/lib/art/render";
import { socialConfigured } from "@/lib/social";
import { NETWORKS, checkConnection, kickScheduler, publicationSelect, runPublication } from "@/lib/social-publish";

// Publicar artes no Facebook e no Instagram (admin e mídia): na hora ou agendado.
export const maxDuration = 60;

const bodySchema = z.object({
  title: z.string().trim().min(1).max(120),
  specs: z.array(artSpecSchema).min(1).max(10),
  caption: z.string().max(2200).default(""),
  networks: z.array(z.enum(NETWORKS)).min(1, "Escolha o Facebook, o Instagram ou os dois").max(2),
  /** vazio = publicar agora */
  publish_at: z.iso.datetime({ offset: true }).nullish(),
});

// GET ?month=2026-11: as publicações do mês (com a semana antes e depois), para o calendário de posts
export const GET = handler(async (req) => {
  await requireAdmin();
  kickScheduler();
  const m = (new URL(req.url).searchParams.get("month") ?? "").match(/^(\d{4})-(\d{2})$/);
  const rows = await prisma.socialPublication.findMany({
    where: m ? { publishAt: { gte: new Date(Date.UTC(+m[1], +m[2] - 1, 1) - 7 * 86400000), lt: new Date(Date.UTC(+m[1], +m[2], 1) + 7 * 86400000) } } : undefined,
    orderBy: { publishAt: m ? "asc" : "desc" },
    take: m ? 200 : 40,
    select: publicationSelect,
  });
  // ?check=1: confere o token na Meta (a aba Publicações e o formulário de publicar avisam se venceu)
  const connection = new URL(req.url).searchParams.get("check") ? await checkConnection() : undefined;
  return json({ configured: socialConfigured(), connection, items: snake(rows) });
});

export const POST = handler(async (req) => {
  const session = await requireAdmin();
  const body = await parseBody(req, bodySchema);
  const at = body.publish_at ? new Date(body.publish_at) : null;
  if (at && at.getTime() < Date.now() - 60_000) return error("Esse horário já passou");
  if (at && at.getTime() > Date.now() + 90 * 86400_000) return error("Agende para no máximo 90 dias");
  if (!at && !socialConfigured()) return error("A conexão com o Facebook e o Instagram ainda não foi configurada", 503);

  const kind = body.specs.length > 1 ? "carrossel" : body.specs[0].format === "story" ? "story" : "feed";
  // gera as imagens agora: o agendado só precisa mandar para a Meta na hora
  const images: string[] = [];
  for (const spec of body.specs) {
    const jpeg = await renderArt(spec);
    const fmt = spec.format === "story" ? { width: 1080, height: 1920 } : spec.format === "square" ? { width: 1080, height: 1080 } : { width: 1080, height: 1350 };
    const img = await prisma.siteImage.create({ data: { mime: "image/jpeg", data: new Uint8Array(jpeg), ...fmt }, select: { id: true } });
    images.push(`/api/images/${img.id}`);
  }
  const row = await prisma.socialPublication.create({
    data: {
      title: body.title,
      kind,
      images,
      caption: kind === "story" ? "" : body.caption,
      networks: body.networks,
      publishAt: at ?? new Date(),
      createdBy: session.user.username || null,
    },
    select: publicationSelect,
  });
  if (at) return json(snake(row), { status: 201 });
  const done = await runPublication(row.id);
  return json(snake(done ?? row), { status: 201 });
});
