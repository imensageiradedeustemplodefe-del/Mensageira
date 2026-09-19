"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Radio, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAudio, getMediaType, type AudioMediaItem } from "@/contexts/AudioContext";
import { api } from "@/lib/fetcher";
import type { MediaItem } from "@/types/database";

export function MediaPlayer() {
  const [gospelRadio, setGospelRadio] = useState<AudioMediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { currentMedia, isPlaying, error, play, pause, loadMedia, clearError } = useAudio();

  useEffect(() => {
    if (gospelRadio && (!currentMedia || currentMedia.id !== gospelRadio.id)) {
      loadMedia(gospelRadio);
    }
  }, [gospelRadio, currentMedia, loadMedia]);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await api<{ items: MediaItem[] }>("/api/media");
        const radio = items.find((m) => m.is_radio) ?? null;
        setGospelRadio(radio);
      } catch (err) {
        console.error("Erro ao buscar rádio gospel:", err);
        toast({ title: "Erro", description: "Erro ao carregar mídia", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const togglePlay = useCallback(async () => {
    if (!gospelRadio) return;
    const mediaType = getMediaType(gospelRadio.media_url);

    if (mediaType === "spotify") {
      window.open(gospelRadio.media_url, "_blank");
      api(`/api/media/${gospelRadio.id}/play`, { method: "POST" }).catch(() => {});
      return;
    }

    if (isPlaying) {
      pause();
    } else {
      try {
        await play();
        toast({ title: "Reprodução Iniciada", description: `Tocando: ${gospelRadio.title}`, duration: 2000 });
      } catch (err) {
        console.error("[MediaPlayer] Play error:", err);
        if (retryCount === 0) {
          setIsRetrying(true);
          setTimeout(() => {
            setRetryCount(1);
            setIsRetrying(false);
            play().catch(() => {});
          }, 1000);
        }
      }
    }
  }, [gospelRadio, isPlaying, play, pause, retryCount]);

  const manualRetry = () => {
    clearError();
    setIsRetrying(false);
    setRetryCount(0);
    togglePlay();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Radio className="w-6 h-6 text-muted-foreground mr-2 animate-pulse" />
            <span className="text-muted-foreground">Carregando rádio gospel...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!gospelRadio) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Mídia Indisponível</h3>
            <p className="text-muted-foreground">Nenhuma mídia gospel foi configurada ainda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mediaType = getMediaType(gospelRadio.media_url);
  const isExternalLink = mediaType === "spotify";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-center">
          <Radio className="w-5 h-5 mr-2" />
          Rádio Gospel
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <div className="bg-muted rounded-lg p-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              {isExternalLink ? <div className="text-primary font-bold text-2xl">♪</div> : <Radio className="w-10 h-10 text-primary" />}
            </div>

            <div>
              <h4 className="font-semibold text-lg">{gospelRadio.title}</h4>
              {gospelRadio.artist && <p className="text-sm text-muted-foreground mt-1">{gospelRadio.artist}</p>}
              {!isExternalLink && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-red-500 animate-pulse" : "bg-muted-foreground"}`} />
                  <span className="text-sm text-muted-foreground">{isPlaying ? "NO AR" : "FORA DO AR"}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-medium">ERRO DE REPRODUÇÃO</span>
                </div>
                <p>{error}</p>
                {!isExternalLink && mediaType !== "youtube" && (
                  <Button size="sm" variant="outline" onClick={manualRetry} className="w-full mt-2" disabled={isRetrying}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? "animate-spin" : ""}`} />
                    {isRetrying ? "Tentando..." : "Tentar Novamente"}
                  </Button>
                )}
              </div>
            )}

            {isRetrying && !error && (
              <div className="bg-muted text-muted-foreground text-sm p-3 rounded-md">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reconectando... (Tentativa {retryCount + 1}/3)</span>
                </div>
              </div>
            )}

            <Button size="lg" onClick={togglePlay} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isExternalLink ? (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Abrir no Spotify
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Ouvir
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              {isExternalLink ? "Este conteúdo será aberto no Spotify Web Player" : "Use o player flutuante para controles em segundo plano"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
