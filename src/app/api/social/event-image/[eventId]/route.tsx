import { getSharedEvent } from "@/lib/share-pages";
import { renderArt } from "@/lib/art/render";
import { artSpecSchema, ordinalFirstDay } from "@/lib/art/spec";
import { eventContribution, eventSignupOpen } from "@/lib/share";

// Arte do evento (feed 4:5, JPEG) para a publicação automática no Instagram/Facebook: mesmo modelo
// "Evento" do gerador de artes do painel, para os posts automáticos terem a mesma identidade.
export const GET = async (_req: Request, ctx: { params: Promise<{ eventId: string }> }) => {
  const { eventId } = await ctx.params;
  const event = await getSharedEvent(eventId);
  if (!event) return new Response("Evento não encontrado", { status: 404 });

  const tz = { timeZone: "America/Sao_Paulo" } as const;
  const date = event.eventDate.toLocaleDateString("pt-BR", { ...tz, weekday: "long", day: "numeric", month: "long" });
  const time = event.eventDate.toLocaleTimeString("pt-BR", { ...tz, hour: "2-digit", minute: "2-digit" }).replace(":", "h");
  const signup = {
    event_date: event.eventDate.toISOString(),
    registration_required: event.registrationRequired,
    registrations_closed: event.registrationsClosed,
    registrations_close_at: event.registrationsCloseAt,
    contribution_cents: event.contributionCents,
    contributions_closed: event.contributionsClosed,
    contributions_close_at: event.contributionsCloseAt,
  };
  const contribution = eventContribution({ ...signup, contribution_note: null });
  const jpeg = await renderArt(
    artSpecSchema.parse({
      format: "feed",
      template: "evento",
      theme: "azul",
      tag: "Hoje tem",
      title: event.title.slice(0, 140),
      date: ordinalFirstDay(`${date.charAt(0).toUpperCase()}${date.slice(1)}`),
      time,
      location: (event.location ?? "").slice(0, 120),
      highlight: eventSignupOpen(signup) ? `Inscrições abertas${contribution ? ` • ${contribution}` : ""}`.slice(0, 90) : "",
    }),
  );
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600" } });
};
