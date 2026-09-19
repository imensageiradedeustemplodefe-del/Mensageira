"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Clock, Users, UserPlus } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { ShareButton } from "@/components/ShareButton";
import { api } from "@/lib/fetcher";
import type { Event } from "@/types/database";

const formatEventDate = (dateString: string, formatStr: string) =>
  format(new Date(dateString), formatStr, { locale: ptBR });

export const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    culto: "bg-blue-100 text-blue-800",
    conferencia: "bg-purple-100 text-purple-800",
    workshop: "bg-green-100 text-green-800",
    retiro: "bg-orange-100 text-orange-800",
    evangelismo: "bg-red-100 text-red-800",
    jovens: "bg-pink-100 text-pink-800",
    geral: "bg-gray-100 text-gray-800",
  };
  return colors[category] || colors["geral"];
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function EventsPage() {
  const [query, setQuery] = useState("");
  const { data: events = [], isLoading: loading } = useQuery({
    queryKey: ["events", "public"],
    queryFn: () => api<Event[]>("/api/events"),
  });

  const handleSearch = useCallback((q: string) => setQuery(q), []);

  const isEventPast = (eventDate: string) => isBefore(new Date(eventDate), startOfDay(new Date()));

  const filteredEvents = query.trim()
    ? events.filter(
        (event) =>
          event.title.toLowerCase().includes(query.toLowerCase()) ||
          event.description?.toLowerCase().includes(query.toLowerCase()) ||
          event.category.toLowerCase().includes(query.toLowerCase()) ||
          event.location?.toLowerCase().includes(query.toLowerCase())
      )
    : events;

  const upcomingEvents = filteredEvents.filter((event) => !isEventPast(event.event_date));
  const pastEvents = filteredEvents.filter((event) => isEventPast(event.event_date));

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 to-peaceful-blue/20 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">Eventos e Programação</h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8">
            Acompanhe nossa programação de eventos especiais e atividades
          </p>
          <div className="max-w-md mx-auto px-4">
            <SearchBar onSearch={handleSearch} placeholder="Pesquisar eventos..." />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-muted-foreground">Carregando eventos...</span>
            </div>
          ) : (
            <>
              <div className="mb-16">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-4">Próximos Eventos</h2>
                  <p className="text-lg text-muted-foreground">Participe dos nossos eventos e atividades especiais.</p>
                </div>

                {upcomingEvents.length === 0 ? (
                  <Card className="max-w-2xl mx-auto">
                    <CardContent className="p-8 text-center">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum evento programado</h3>
                      <p className="text-muted-foreground">Fique atento às nossas redes sociais para novos eventos!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {upcomingEvents.map((event) => (
                      <Card key={event.id} className="hover:shadow-lg transition-all duration-300 border-primary/20">
                        {event.image_url && (
                          <div className="aspect-video overflow-hidden rounded-t-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getCategoryColor(event.category)}>{capitalize(event.category)}</Badge>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatEventDate(event.event_date, "dd/MM")}
                            </div>
                          </div>
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {event.description && (
                            <p className="text-muted-foreground leading-relaxed line-clamp-3">{event.description}</p>
                          )}

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="w-4 h-4 mr-2 text-primary" />
                              {formatEventDate(event.event_date, "dd/MM/yyyy 'às' HH:mm")}
                            </div>
                            {event.location && (
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="w-4 h-4 mr-2 text-primary" />
                                {event.location}
                              </div>
                            )}
                            {event.max_participants && (
                              <div className="flex items-center text-muted-foreground">
                                <Users className="w-4 h-4 mr-2 text-primary" />
                                Máximo: {event.max_participants} pessoas
                              </div>
                            )}
                          </div>

                          {event.registration_required && (
                            <div className="pt-2 border-t space-y-2">
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                Inscrição Obrigatória
                              </Badge>
                              <Link href={`/eventos/${event.id}/inscricao`} className="block">
                                <Button className="w-full" size="sm">
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Inscrever-se
                                </Button>
                              </Link>
                              {event.contact_info && (
                                <p className="text-xs text-muted-foreground">Contato: {event.contact_info}</p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {pastEvents.length > 0 && (
                <div>
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-foreground mb-4">Eventos Anteriores</h2>
                    <p className="text-lg text-muted-foreground">Veja alguns dos eventos que já realizamos.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {pastEvents.slice(0, 6).map((event) => (
                      <Card key={event.id} className="hover:shadow-lg transition-all duration-300 opacity-75">
                        {event.image_url && (
                          <div className="aspect-video overflow-hidden rounded-t-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover grayscale" />
                          </div>
                        )}
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className={getCategoryColor(event.category)}>
                              {capitalize(event.category)}
                            </Badge>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatEventDate(event.event_date, "dd/MM")}
                            </div>
                          </div>
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {event.description && (
                            <p className="text-muted-foreground leading-relaxed line-clamp-2">{event.description}</p>
                          )}

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="w-4 h-4 mr-2 text-primary" />
                              {formatEventDate(event.event_date, "dd/MM/yyyy 'às' HH:mm")}
                            </div>
                            {event.location && (
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="w-4 h-4 mr-2 text-primary" />
                                {event.location}
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t">
                            <ShareButton
                              title={event.title}
                              text={`Participe do evento: ${event.title}\n${event.description || ""}`}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
