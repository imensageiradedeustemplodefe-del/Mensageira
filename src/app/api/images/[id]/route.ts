import { prisma } from "@/lib/prisma";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Imagem do conteúdo do site. Nunca muda (trocar a foto gera outro id): cache de 1 ano no navegador e na CDN,
// então o banco só é lido na primeira vez.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new Response("Não encontrada", { status: 404 });
  const image = await prisma.siteImage.findUnique({ where: { id }, select: { mime: true, data: true } });
  if (!image) return new Response("Não encontrada", { status: 404 });
  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mime,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
