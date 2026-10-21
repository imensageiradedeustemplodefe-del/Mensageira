import sharp from "sharp";
import { ogResponse, OgCard } from "@/lib/og";
import { getSharedEvent } from "@/lib/share-pages";

// Imagem quadrada (1080x1080, JPEG) do evento para a publicação automática no Instagram/Facebook.
// O Instagram só aceita JPEG, por isso a conversão.
export const GET = async (_req: Request, ctx: { params: Promise<{ eventId: string }> }) => {
  const { eventId } = await ctx.params;
  const event = await getSharedEvent(eventId);
  if (!event) return new Response("Evento não encontrado", { status: 404 });

  const tz = { timeZone: "America/Sao_Paulo" } as const;
  const date = event.eventDate.toLocaleDateString("pt-BR", { ...tz, weekday: "long", day: "2-digit", month: "long" });
  const time = event.eventDate.toLocaleTimeString("pt-BR", { ...tz, hour: "2-digit", minute: "2-digit" });
  const png = await ogResponse(
    (logo) => (
      <OgCard
        logo={logo}
        label="HOJE TEM"
        title={event.title}
        lines={[`${date.charAt(0).toUpperCase()}${date.slice(1)} • ${time}`, ...(event.location ? [event.location] : []), "Venha participar!"]}
      />
    ),
    { width: 1080, height: 1080 }
  );
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 90 }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600" } });
};
