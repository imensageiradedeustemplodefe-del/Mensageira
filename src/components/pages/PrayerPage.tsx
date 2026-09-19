"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PrayerRequestForm from "@/components/PrayerRequestForm";
import { api } from "@/lib/fetcher";
import type { PublicPrayerRequest } from "@/types/database";

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    saude: "text-red-600",
    familia: "text-blue-600",
    trabalho: "text-green-600",
    financeiro: "text-yellow-600",
    espiritual: "text-purple-600",
    geral: "text-gray-600",
  };
  return colors[category] || colors["geral"];
};

export function PrayerPage() {
  const { data: requests = [], isLoading: loading } = useQuery({
    queryKey: ["prayers", "public"],
    queryFn: () => api<PublicPrayerRequest[]>("/api/prayers"),
  });

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 to-peaceful-blue/20 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">Casa de Oração</h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            &quot;A minha casa será chamada casa de oração para todos os povos&quot; - Isaías 56:7
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Compartilhe Sua Necessidade</h2>
            <p className="text-lg text-muted-foreground">Nossa equipe pastoral estará intercedendo por você em oração.</p>
          </div>
          <PrayerRequestForm />
        </div>
      </section>

      <section className="py-16 bg-accent/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Pedidos da Comunidade</h2>
            <p className="text-lg text-muted-foreground">Vamos interceder uns pelos outros em comunhão.</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-muted-foreground">Carregando pedidos...</span>
            </div>
          ) : requests.length === 0 ? (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum pedido público no momento</h3>
                <p className="text-muted-foreground">
                  Seja o primeiro a compartilhar uma necessidade de oração com a comunidade.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {requests.map((request) => (
                <Card key={request.id} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <Heart className="w-4 h-4 mr-2 text-primary" />
                        {request.display_name || "Anônimo"}
                      </CardTitle>
                      {request.is_urgent && (
                        <Badge variant="destructive" className="text-xs">
                          Urgente
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground leading-relaxed line-clamp-4">{request.request_text}</p>

                    <div className="flex items-center justify-between">
                      <Badge className={getCategoryColor(request.category)}>
                        {request.category.charAt(0).toUpperCase() + request.category.slice(1)}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(request.created_at), "dd 'de' MMM", { locale: ptBR })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
