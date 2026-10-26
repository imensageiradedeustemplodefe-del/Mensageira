import { z } from "zod";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { error, handler, json, parseBody, requireAdmin } from "@/lib/api";

// Traz uma foto da galeria (Google Drive) para usar como fundo de arte: baixa em boa resolução,
// reduz para no máximo 1600px e guarda como imagem do site.
export const maxDuration = 30;

export const POST = handler(async (req) => {
  await requireAdmin();
  const { id } = await parseBody(req, z.object({ id: z.string().regex(/^[A-Za-z0-9_-]{10,100}$/, "foto inválida") }));
  const res = await fetch(`https://drive.google.com/thumbnail?id=${id}&sz=w1600`, { redirect: "follow", cache: "no-store" }).catch(() => null);
  const type = res?.headers.get("content-type") ?? "";
  if (!res?.ok || !type.startsWith("image/")) return error("Não foi possível buscar a foto no Google Drive. Tente outra ou envie do aparelho.", 502);
  const input = Buffer.from(await res.arrayBuffer());
  const out = await sharp(input).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer({ resolveWithObject: true });
  const image = await prisma.siteImage.create({
    data: { mime: "image/jpeg", data: out.data, width: out.info.width, height: out.info.height },
    select: { id: true },
  });
  return json({ url: `/api/images/${image.id}` }, { status: 201 });
});
