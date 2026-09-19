"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAudio } from "@/contexts/AudioContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Radio, X, Minimize2, Maximize2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";

interface GlobalAudioPlayerProps {
  onClose?: () => void;
}

export const GlobalAudioPlayer: React.FC<GlobalAudioPlayerProps> = ({ onClose }) => {
  const {
    currentMedia,
    isPlaying,
    volume,
    isMuted,
    error,
    loading,
    hasStartedPlayback,
    play,
    pause,
    setVolume,
    toggleMute,
    clearError,
    closePlayer,
  } = useAudio();

  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  useEffect(() => {
    if (error) {
      toast({ title: "Erro de Reprodução", description: error, variant: "destructive" });
    }
  }, [error]);

  const getPlayerSize = useCallback(
    () => (isMinimized ? { width: 180, height: 60 } : { width: 300, height: 200 }),
    [isMinimized]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
    },
    [position]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      e.preventDefault();
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const { width, height } = getPlayerSize();
      const maxX = window.innerWidth - width - 10;
      const maxY = window.innerHeight - height - 10;
      setPosition({
        x: Math.max(10, Math.min(dragStartRef.current.posX + deltaX, maxX)),
        y: Math.max(10, Math.min(dragStartRef.current.posY - deltaY, maxY)),
      });
    },
    [isDragging, getPlayerSize]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
    },
    [isDragging]
  );

  if (!currentMedia || !hasStartedPlayback) return null;

  const handlePlayPause = async () => {
    try {
      if (isPlaying) pause();
      else await play();
    } catch (err) {
      console.error("[GlobalAudioPlayer] Play/Pause error:", err);
    }
  };

  const handleClose = () => {
    closePlayer();
    onClose?.();
  };

  return (
    <Card
      className={`fixed shadow-2xl z-[9999] bg-background/98 backdrop-blur-md border border-border/60 rounded-xl overflow-hidden transition-[width,height] duration-200 ease-out ${
        isDragging ? "shadow-2xl scale-[1.02]" : "hover:shadow-xl"
      }`}
      style={{
        left: `${position.x}px`,
        bottom: `${position.y}px`,
        width: isMinimized ? "180px" : "300px",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <div
        className={`flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/30 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <Radio className="w-3.5 h-3.5 text-primary" />
          {!isMinimized && <span className="text-xs font-medium text-muted-foreground">Player</span>}
        </div>
        <div className="flex items-center gap-0.5" onPointerDown={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6 min-h-0 min-w-0 p-0 hover:bg-muted rounded-md"
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClose}
            className="h-6 w-6 min-h-0 min-w-0 p-0 hover:bg-destructive/10 hover:text-destructive rounded-md"
            title="Fechar"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <CardContent className="p-3">
        {!isMinimized ? (
          <div className="space-y-3">
            <div className="text-center">
              <h4 className="font-medium text-sm truncate">{currentMedia.title}</h4>
              {currentMedia.artist && <p className="text-xs text-muted-foreground truncate">{currentMedia.artist}</p>}
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-red-500 animate-pulse" : "bg-muted-foreground"}`} />
                <span className="text-xs text-muted-foreground font-medium">{isPlaying ? "AO VIVO" : "PAUSADO"}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button size="sm" variant="ghost" onClick={toggleMute} className="h-8 w-8 min-h-0 min-w-0 p-0 rounded-full" disabled={loading}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>

              <Button
                size="sm"
                onClick={handlePlayPause}
                disabled={loading}
                className="h-11 w-11 p-0 rounded-full bg-primary hover:bg-primary/90 shadow-md"
                title={loading ? "Carregando..." : isPlaying ? "Pausar" : "Reproduzir"}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>

              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={(v) => setVolume(v[0])}
                  max={100}
                  step={1}
                  className="w-full"
                  disabled={loading}
                />
              </div>
            </div>

            {loading && !error && (
              <div className="text-xs text-center text-muted-foreground bg-muted/50 py-1.5 px-2 rounded-md">Conectando...</div>
            )}

            {error && (
              <div className="text-xs text-destructive text-center bg-destructive/10 py-1.5 px-2 rounded-md flex items-center justify-center gap-2">
                <span className="truncate">{error}</span>
                <Button size="sm" variant="ghost" onClick={clearError} className="h-auto min-h-0 min-w-0 p-0 text-xs underline shrink-0">
                  OK
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePlayPause}
              disabled={loading}
              className="h-8 w-8 min-h-0 min-w-0 p-0 rounded-full bg-primary hover:bg-primary/90 shrink-0"
            >
              {loading ? (
                <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5 ml-0.5" />
              )}
            </Button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{currentMedia.title}</p>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPlaying ? "bg-red-500 animate-pulse" : "bg-muted-foreground"}`} />
                <span className="text-[10px] text-muted-foreground">{isPlaying ? "AO VIVO" : "PARADO"}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
