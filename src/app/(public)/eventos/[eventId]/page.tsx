import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, MapPin, UserPlus, ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShareButton } from "@/components/ShareButton";
import { getSharedEvent, fmtEventDate } from "@/lib/share-pages";
import { shareEvent } from "@/lib/share";

type Props = { params: Promise<{ eventId: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getSharedEvent(eventId);
  if (!event) return { title: "Evento não encontrado", robots: { index: false } };
  const when = fmtEventDate(event.eventDate);
  const description = `${when.charAt(0).toUpperCase()}${when.slice(1)}${event.location ? ` • ${event.location}` : ""}${
    event.description ? ` — ${event.description}` : ""
  }`;
  return {
    title: event.title,
    description,
    alternates: { canonical: `/eventos/${event.id}` },
    openGraph: { title: event.title, description, type: "article", url: `/eventos/${event.id}` },
    twitter: { title: event.title, description },
  };
}

export default async function Page({ params }: Props) {
  const { eventId } = await params;
  const event = await getSharedEvent(eventId);
  if (!event) notFound();

  const date = event.eventDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const time = event.eventDate.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
  const past = event.eventDate.getTime() < Date.now() - 6 * 3600 * 1000;
  const share = shareEvent({
    id: event.id,
    title: event.title,
    event_date: event.eventDate.toISOString(),
    location: event.location,
    description: event.description,
  });

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 to-peaceful-blue/20 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">{past ? "Evento realizado" : "Evento"}</p>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground">{event.title}</h1>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Card>
            {event.imageUrl && (
              <div className="aspect-video overflow-hidden rounded-t-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              </div>
            )}
            <CardContent className="p-6 space-y-5">
              <div className="space-y-3 text-foreground">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary shrink-0" />
                  <span className="capitalize">{date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary shrink-0" />
                  <span>{time}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary shrink-0" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.maxParticipants && (
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary shrink-0" />
                    <span>Máximo: {event.maxParticipants} pessoas</span>
                  </div>
                )}
              </div>

              {event.description && <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{event.description}</p>}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {event.registrationRequired && !past && (
                  <Link href={`/eventos/${event.id}/inscricao`} className="sm:flex-1">
                    <Button className="w-full">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Inscrever-se
                    </Button>
                  </Link>
                )}
                <ShareButton data={share} className="sm:flex-1" />
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Link href="/eventos">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ver toda a programação
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
