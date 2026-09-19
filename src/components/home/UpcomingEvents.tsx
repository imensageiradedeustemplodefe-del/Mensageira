"use client";

import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShareButton } from "@/components/ShareButton";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface UpcomingEventsProps {
  loading?: boolean;
}

const EventSkeleton = () => (
  <Card className="border-none bg-card/60 backdrop-blur">
    <CardHeader className="pb-3">
      <Skeleton className="h-6 w-3/4" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-16 w-full" />
    </CardContent>
  </Card>
);

export const UpcomingEvents = ({ loading = false }: UpcomingEventsProps) => {
  const { settings } = useSiteSettings();

  const upcomingEvents = [
    {
      title: "Culto de Cura e Libertação",
      date: "Sexta-feira",
      time: settings.friday_service_time || "20:00",
      description:
        "Noite de oração especial para cura física, emocional e espiritual. Venha buscar a libertação em Jesus Cristo.",
    },
    {
      title: "Culto da Família",
      date: "Domingo",
      time: settings.sunday_service_time || "19:30",
      description:
        "Culto especial para toda a família, com mensagens edificantes e momentos de adoração em comunidade.",
    },
    {
      title: "Santa Ceia",
      date: "2º Domingo do Mês",
      time: settings.sunday_service_time || "19:30",
      description: "Celebração da Santa Ceia do Senhor, momento sagrado de comunhão e renovação espiritual.",
    },
    {
      title: "Louvorzão dos Jovens",
      date: "1º Sábado do Mês",
      time: "19:30",
      description:
        "Noite especial de louvor e adoração com os jovens. Venha participar desse momento de celebração!",
    },
    {
      title: "Preparação para Santa Ceia",
      date: "2º Sábado do Mês",
      time: "19:30",
      description:
        "Reunião de preparação espiritual para a celebração da Santa Ceia. Momento de reflexão e consagração.",
    },
    {
      title: "Lavacar",
      date: "3º Sábado do Mês",
      time: "08:00",
      description: "Evento de lavagem de carros em prol da igreja. Venha apoiar e participar desse momento de comunhão!",
    },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Próximos Eventos</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Participe dos nossos cultos e atividades. Todos são bem-vindos!
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => <EventSkeleton key={index} />)
            : upcomingEvents.map((event, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 border-none bg-card/60 backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg text-foreground leading-tight">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">{event.date}</span>
                      </div>
                      <ShareButton title={event.title} text={event.description} size="sm" variant="ghost" />
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{event.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/eventos">
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10">
              Ver Todos os Eventos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
