"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Calendar, Clock, Youtube, Facebook, Globe, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { api } from "@/lib/fetcher";
import type { LiveStream } from "@/types/database";

declare global {
  interface Window {
    FB?: { XFBML: { parse: () => void } };
  }
}

export function LivePage() {
  const { settings } = useSiteSettings();
  const { data: streams = [], isLoading: loading } = useQuery({
    queryKey: ["live", "public"],
    queryFn: () => api<LiveStream[]>("/api/live"),
    refetchInterval: 60 * 1000,
  });
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [nextService, setNextService] = useState<string>("");

  // Carregar SDK do Facebook
  useEffect(() => {
    if (window.FB) {
      window.FB.XFBML.parse();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/pt_BR/sdk.js#xfbml=1&version=v18.0";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!loading && streams.length > 0) {
      const liveStream = streams.find((s) => s.is_live);
      setActiveStream((prev) => {
        const stillThere = prev && streams.find((s) => s.id === prev.id);
        return liveStream || stillThere || streams[0] || null;
      });
    }
  }, [streams, loading]);

  useEffect(() => {
    if (activeStream?.platform === "facebook" && window.FB) {
      setTimeout(() => window.FB?.XFBML.parse(), 100);
    }
  }, [activeStream]);

  // Calcular próximo culto
  useEffect(() => {
    const scheduledStreams = streams
      .filter((s) => s.scheduled_at && new Date(s.scheduled_at) > new Date())
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());

    if (scheduledStreams.length > 0) {
      const nextStream = scheduledStreams[0];
      setNextService(`${nextStream.title} - ${new Date(nextStream.scheduled_at!).toLocaleString("pt-BR")}`);
      return;
    }

    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const fridayTime = settings.friday_service_time || "20:00";
    const sundayTime = settings.sunday_service_time || "19:30";
    const [fridayHour] = fridayTime.split(":").map(Number);
    const [sundayHour] = sundayTime.split(":").map(Number);

    if (day === 5 && hour < fridayHour) setNextService(`Hoje às ${fridayTime} - Culto de Cura e Libertação`);
    else if (day === 0 && hour < sundayHour) setNextService(`Hoje às ${sundayTime} - Culto da Família`);
    else if (day < 5) setNextService(`Sexta-feira às ${fridayTime} - Culto de Cura e Libertação`);
    else if (day === 5 && hour >= fridayHour) setNextService(`Domingo às ${sundayTime} - Culto da Família`);
    else if (day === 6) setNextService(`Domingo às ${sundayTime} - Culto da Família`);
    else setNextService(`Sexta-feira às ${fridayTime} - Culto de Cura e Libertação`);
  }, [streams, settings.friday_service_time, settings.sunday_service_time]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube":
        return <Youtube className="w-4 h-4" />;
      case "facebook":
        return <Facebook className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const services = [
    {
      name: "Culto de Cura e Libertação",
      day: "Sexta-feira",
      time: settings.friday_service_time || "20:00",
      description:
        "Noite de oração especial para cura física, emocional e espiritual. Venha buscar a libertação em Jesus Cristo.",
    },
    {
      name: "Culto da Família",
      day: "Domingo",
      time: settings.sunday_service_time || "19:30",
      description:
        "Culto especial para toda a família, com mensagens edificantes e momentos de adoração em comunidade.",
    },
    {
      name: "Santa Ceia",
      day: "2º Domingo do Mês",
      time: settings.sunday_service_time || "19:30",
      description: "Celebração da Santa Ceia do Senhor, momento sagrado de comunhão e renovação espiritual.",
    },
  ];

  const youtubeChatId = activeStream?.stream_url.match(/(?:v=|\/)([\w-]{11})/)?.[1] || "";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando transmissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 to-peaceful-blue/20 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">Transmissão ao Vivo</h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Participe dos nossos cultos online e faça parte da nossa comunidade de fé.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/10 border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3">
                  {activeStream?.is_live ? (
                    <>
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <Badge variant="destructive" className="animate-pulse">
                        AO VIVO
                      </Badge>
                      <span className="text-foreground font-medium">{activeStream.title}</span>
                      <div className="flex items-center space-x-1 text-sm">
                        {getPlatformIcon(activeStream.platform)}
                        <span className="capitalize">{activeStream.platform}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-muted rounded-full"></div>
                      <Badge variant="secondary">OFFLINE</Badge>
                      <span className="text-muted-foreground">Próximo: {nextService}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <span className="text-sm">Canal: Mensageira de Deus Templo de Fé</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-none shadow-lg">
            <CardContent className="p-0">
              <div className="aspect-video bg-muted/30 relative">
                {activeStream && activeStream.platform === "facebook" ? (
                  <div className="absolute inset-0 w-full h-full">
                    <div
                      className="fb-video w-full h-full"
                      data-href={activeStream.stream_url}
                      data-width="auto"
                      data-show-text="false"
                      data-allowfullscreen="true"
                    ></div>
                  </div>
                ) : activeStream && activeStream.embed_url ? (
                  <iframe
                    src={activeStream.embed_url}
                    title={activeStream.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/20 to-peaceful-blue/30" />
                )}

                {!activeStream?.is_live && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm">
                    <div className="text-center space-y-4 px-4">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                        <Play className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {activeStream ? activeStream.title : "Transmissão Offline"}
                        </h3>
                        <p className="text-muted-foreground">
                          {activeStream
                            ? activeStream.description || "Aguardando início da transmissão"
                            : "A transmissão será iniciada nos horários dos cultos"}
                        </p>
                        {activeStream?.scheduled_at && (
                          <p className="text-sm text-primary mt-2">
                            Agendado para: {new Date(activeStream.scheduled_at).toLocaleString("pt-BR")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {activeStream?.is_live && activeStream.platform === "youtube" && activeStream.chat_enabled && youtubeChatId && (
            <Card className="mt-4 overflow-hidden border-none shadow-lg">
              <CardContent className="p-0">
                <div className="aspect-video max-h-[400px]">
                  <iframe
                    src={`https://www.youtube.com/live_chat?v=${youtubeChatId}&embed_domain=${window.location.hostname}`}
                    title="Chat ao Vivo"
                    className="w-full h-full"
                  ></iframe>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-6 px-4">
            {streams.length > 0 ? (
              streams.map((stream) => (
                <Button
                  key={stream.id}
                  variant="outline"
                  size="lg"
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={() => window.open(stream.stream_url, "_blank")}
                >
                  {getPlatformIcon(stream.platform)}
                  <span className="ml-2">Ver em {stream.platform}</span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              ))
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="border-primary text-primary hover:bg-primary/10"
                onClick={() => window.open(settings.youtube_url || "https://www.youtube.com/@imensageiradedeustemlodefe", "_blank")}
              >
                <Youtube className="w-5 h-5 mr-2" />
                Visitar Canal no YouTube
              </Button>
            )}
          </div>

          {streams.length > 1 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-center mb-4 px-4">Outras Transmissões Disponíveis</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {streams
                  .filter((s) => s.id !== activeStream?.id)
                  .map((stream) => (
                    <Card
                      key={stream.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setActiveStream(stream)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{stream.title}</h4>
                            <p className="text-sm text-muted-foreground">{stream.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              {getPlatformIcon(stream.platform)}
                              <span className="text-xs capitalize">{stream.platform}</span>
                              {stream.is_live && (
                                <Badge variant="destructive" className="text-xs">
                                  AO VIVO
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-accent/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Programação de Transmissões</h2>
            <p className="text-lg text-muted-foreground">Acompanhe nossa programação regular de cultos e eventos especiais.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 bg-card/60 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-foreground">{service.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">{service.day}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">{service.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-br from-primary/5 to-peaceful-blue/10 border-none">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-foreground">Como Participar Online</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-center">
                {[
                  ["1", "Acesse no Horário", "Entre na página nos horários dos cultos para participar ao vivo"],
                  ["2", "Participe do Chat", "Use o chat do YouTube para interagir e enviar pedidos de oração"],
                  ["3", "Compartilhe", "Convide amigos e familiares para participar juntos"],
                ].map(([n, title, text]) => (
                  <div key={n}>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl font-bold text-primary">{n}</span>
                    </div>
                    <h3 className="font-medium text-foreground mb-2">{title}</h3>
                    <p className="text-sm">{text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
