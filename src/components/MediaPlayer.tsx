"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Radio, RefreshCw, AlertTriangle, Volume2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAudio, getMediaType, type AudioMediaItem } from "@/contexts/AudioContext";
import { api } from "@/lib/fetcher";
import type { MediaItem } from "@/types/database";

export function MediaPlayer() {
  const [radios, setRadios] = useState<AudioMediaItem[]>([]);
  const [selected, setSelected] = useState<AudioMediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [pendingPlay, setPendingPlay] = useState(false);

  const { currentMedia, isPlaying, error, loading: audioLoading, play, pause, loadMedia, clearError } = useAudio();

  useEffect(() => {
    (async () => {
      try {
        const { items } = await api<{ items: MediaItem[] }>("/api/media");
        const list = items.filter((m) => m.is_radio);
        setRadios(list);
        setSelected(list[0] ?? null);
      } catch (err) {
        console.error("Erro ao buscar rádios gospel:", err);
        toast({ title: "Erro", description: "Erro ao carregar mídia", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Carrega a rádio selecionada no player global
  useEffect(() => {
    if (selected && (!currentMedia || currentMedia.id !== selected.id)) {
      loadMedia(selected);
    }
  }, [selected, currentMedia, loadMedia]);

  // Ao trocar de estação com o player tocando, inicia a nova automaticamente
  useEffect(() => {
    if (pendingPlay && selected && currentMedia?.id === selected.id) {
      setPendingPlay(false);
      play().catch(() => {});
    }
  }, [pendingPlay, selected, currentMedia, play]);

  const togglePlay = useCallback(async () => {
    if (!selected) return;
    const mediaType = getMediaType(selected.media_url);

    if (mediaType === "spotify") {
      window.open(selected.media_url, "_blank");
      api(`/api/media/${selected.id}/play`, { method: "POST" }).catch(() => {});
      return;
    }

    if (isPlaying) {
      pause();
    } else {
      try {
        await play();
        toast({ title: "Reprodução Iniciada", description: `Tocando: ${selected.title}`, duration: 2000 });
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
  }, [selected, isPlaying, play, pause, retryCount]);

  const selectRadio = (radio: AudioMediaItem) => {
    if (radio.id === selected?.id) return;
    const wasPlaying = isPlaying;
    clearError();
    setRetryCount(0);
    setSelected(radio);
    if (wasPlaying) setPendingPlay(true);
  };

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

  if (!selected) {
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

  const mediaType = getMediaType(selected.media_url);
  const isExternalLink = mediaType === "spotify";
  const isCurrent = currentMedia?.id === selected.id;
  const playingThis = isCurrent && isPlaying;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-center">
          <Radio className="w-5 h-5 mr-2" />
          Rádio Gospel
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="bg-muted rounded-lg p-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              {isExternalLink ? <div className="text-primary font-bold text-2xl">♪</div> : <Radio className="w-10 h-10 text-primary" />}
            </div>

            <div>
              <h4 className="font-semibold text-lg">{selected.title}</h4>
              {selected.artist && <p className="text-sm text-muted-foreground mt-1">{selected.artist}</p>}
              {!isExternalLink && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${playingThis ? "bg-red-500 animate-pulse" : "bg-muted-foreground"}`} />
                  <span className="text-sm text-muted-foreground">{playingThis ? "NO AR" : "FORA DO AR"}</span>
                </div>
              )}
            </div>

            {error && isCurrent && (
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

            <Button size="lg" onClick={togglePlay} disabled={audioLoading && isCurrent} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isExternalLink ? (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Abrir no Spotify
                </>
              ) : audioLoading && isCurrent ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : playingThis ? (
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

        {radios.length > 1 && (
          <div className="mt-6">
            <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <Volume2 className="w-4 h-4 mr-2 text-primary" />
              Outras estações
            </h5>
            <div className="grid sm:grid-cols-2 gap-2">
              {radios.map((radio) => {
                const active = radio.id === selected.id;
                return (
                  <button
                    key={radio.id}
                    type="button"
                    onClick={() => selectRadio(radio)}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-200 min-h-[56px] ${
                      active
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:bg-accent/50 hover:border-primary/40"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {active && playingThis ? <Volume2 className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${active ? "text-primary" : "text-foreground"}`}>{radio.title}</p>
                      {radio.artist && <p className="text-xs text-muted-foreground truncate">{radio.artist}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
