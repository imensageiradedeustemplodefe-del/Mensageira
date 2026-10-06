import { ogResponse, OgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getSharedEvent } from "@/lib/share-pages";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Evento da Igreja Mensageira De Deus Templo De Fé";
export const revalidate = 300;

export default async function Image({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await getSharedEvent(eventId);
  const tz = { timeZone: "America/Sao_Paulo" } as const;
  const date = event?.eventDate.toLocaleDateString("pt-BR", { ...tz, weekday: "long", day: "2-digit", month: "long" }) ?? "";
  const time = event?.eventDate.toLocaleTimeString("pt-BR", { ...tz, hour: "2-digit", minute: "2-digit" }) ?? "";

  return ogResponse((logo) => (
    <OgCard
      logo={logo}
      label="EVENTO"
      title={event?.title ?? "Programação da igreja"}
      lines={event ? [`${date.charAt(0).toUpperCase()}${date.slice(1)} • ${time}`, ...(event.location ? [event.location] : [])] : []}
    />
  ));
}
