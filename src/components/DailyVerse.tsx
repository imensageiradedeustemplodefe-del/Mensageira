"use client";

import { RefreshCw } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { shareVerse } from "@/lib/share";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDailyVerses } from "@/hooks/useDailyVerses";

const DailyVerse = () => {
  const { verse, isLoading, error, refreshVerse, getDailyVerse } = useDailyVerses();


  if (error) {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary-light/20 to-warm-gold/30 border-none shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-spiritual-glow/5 to-transparent"></div>
        <CardContent className="relative p-6 sm:p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-4">Palavra do Dia</h3>
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={getDailyVerse} className="mt-4">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary-light/20 to-warm-gold/30 border-none shadow-lg min-h-[200px]">
      <div className="absolute inset-0 bg-gradient-to-br from-spiritual-glow/5 to-transparent"></div>
      <CardContent className="relative p-6 sm:p-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Palavra do Dia</h3>
            {verse?.category && (
              <span className="text-xs text-muted-foreground capitalize bg-muted/50 px-2 py-1 rounded-full mt-1 inline-block">
                {verse.category.replace("_", " ")}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={refreshVerse} disabled={isLoading} className="hover:bg-white/20" title="Novo versículo">
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            {verse && (
              <ShareButton
                data={shareVerse(verse)}
                variant="ghost"
                size="icon"
                label="Compartilhar versículo"
                className="h-9 w-9 hover:bg-white/20"
              />
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/3"></div>
          </div>
        ) : verse ? (
          <div className="space-y-3">
            <blockquote className="text-foreground text-base sm:text-lg italic leading-relaxed">&quot;{verse.verse_text}&quot;</blockquote>
            <cite className="block text-sm font-medium text-muted-foreground">— {verse.verse_reference}</cite>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>Nenhum versículo cadastrado.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyVerse;
