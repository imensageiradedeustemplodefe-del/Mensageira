import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, error, parseBody, requireAdmin } from "@/lib/api";

// Envio de imagem (já reduzida no navegador): fotos do conteúdo do site (admin) e fundos das artes (admin e mídia).
const MAX_BYTES = 1_500_000;

export const POST = handler(async (req) => {
  await requireAdmin();
  const body = await parseBody(
    req,
    z.object({
      data: z.string().max(2_100_000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "imagem inválida"),
      width: z.number().int().positive().max(5000).optional(),
      height: z.number().int().positive().max(5000).optional(),
    }),
  );
  const [, mime, b64] = body.data.match(/^data:(image\/[a-z]+);base64,(.+)$/)!;
  const bytes = Buffer.from(b64, "base64");
  if (bytes.length > MAX_BYTES) return error("Imagem muito grande (máx. 1,5 MB)", 413);
  const image = await prisma.siteImage.create({
    data: { mime, data: bytes, width: body.width, height: body.height },
    select: { id: true },
  });
  return json({ url: `/api/images/${image.id}` }, { status: 201 });
});
