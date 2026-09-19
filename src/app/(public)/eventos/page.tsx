import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { eventsJsonLd, CITY, STATE } from "@/lib/seo";
import { EventsPage } from "@/components/pages/EventsPage";

export const revalidate = 600;

export const metadata: Metadata = {
  title: `Eventos e Cultos em ${CITY} - ${STATE}`,
  description: `Programação de cultos, Santa Ceia, Culto de Cura e Libertação e eventos da Igreja Mensageira de Deus Templo de Fé em ${CITY} - ${STATE}.`,
};

export default async function Page() {
  // Dados estruturados dos próximos eventos (rich results do Google); a lista em si é carregada no cliente
  let jsonLd: object | null = null;
  try {
    const events = await prisma.event.findMany({
      where: { isPublished: true, eventDate: { gte: new Date() } },
      orderBy: { eventDate: "asc" },
      take: 30,
      select: { id: true, title: true, description: true, eventDate: true, location: true, imageUrl: true, registrationRequired: true },
    });
    if (events.length) jsonLd = eventsJsonLd(events);
  } catch {
    jsonLd = null;
  }

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <EventsPage />
    </>
  );
}
