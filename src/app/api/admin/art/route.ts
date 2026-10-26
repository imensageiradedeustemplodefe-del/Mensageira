import { handler, parseBody, requireAdmin } from "@/lib/api";
import { artSpecSchema } from "@/lib/art/spec";
import { renderArt } from "@/lib/art/render";

// Gera a arte (JPEG) a partir das escolhas do gerador do painel: usada na prévia e no "Baixar".
export const maxDuration = 30;

export const POST = handler(async (req) => {
  await requireAdmin();
  const spec = await parseBody(req, artSpecSchema);
  const jpeg = await renderArt(spec);
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" } });
});
