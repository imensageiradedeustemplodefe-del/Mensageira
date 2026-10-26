import { prisma } from "@/lib/prisma";
import { error, handler, json, param, requireAdmin } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMAGE = /^\/api\/images\/([0-9a-f-]{36})$/i;

// Cancelar um agendamento (ou tirar da lista uma publicação que deu erro). O que já foi publicado
// continua no Facebook e no Instagram: aqui só sai do histórico.
export const DELETE = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const id = await param(ctx, "id");
  if (!UUID.test(id)) return error("Publicação não encontrada", 404);
  const row = await prisma.socialPublication.findUnique({ where: { id }, select: { status: true, images: true } });
  if (!row) return error("Publicação não encontrada", 404);
  if (row.status === "publicando") return error("Está sendo publicada agora; tente de novo em um minuto", 409);
  await prisma.socialPublication.delete({ where: { id } });
  // as imagens só servem para a publicação (as publicadas já estão na Meta)
  const ids = row.images.map((u) => u.match(IMAGE)?.[1]).filter((x): x is string => !!x);
  if (ids.length) await prisma.siteImage.deleteMany({ where: { id: { in: ids } } });
  return json({ ok: true });
});
