"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Play, Pause, X, Radio, PictureInPicture2 } from "lucide-react";
import { useAudio } from "@/contexts/AudioContext";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { isRadioPipSupported, openRadioPip, updateRadioPip, closeRadioPip } from "@/lib/radio-pip";

/**
 * Miniplayer da rádio, no estilo do YouTube: aparece quando a rádio está tocando e o player
 * principal (página inicial) não está na tela. No celular é uma faixa fixa logo acima do menu
 * inferior; no computador, um cartão no canto inferior direito. Tocar na faixa volta ao player.
 */
export const GlobalAudioPlayer: React.FC = () => {
  const { currentMedia, isPlaying, error, loading, hasStartedPlayback, play, pause, closePlayer } = useAudio();
  const inlineVisible = useInlinePlayerVisible();
  const isMobile = useIsMobile();
  const navHeight = useBottomNavHeight(isMobile);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (error) toast({ title: "Erro de Reprodução", description: error, variant: "destructive" });
  }, [error]);

  // Mantém a janela flutuante (PiP) em dia com a rádio; fecha junto com o player
  useEffect(() => {
    if (!currentMedia) {
      closeRadioPip();
      return;
    }
    updateRadioPip({ title: currentMedia.title, subtitle: currentMedia.artist, playing: isPlaying });
  }, [currentMedia, isPlaying]);

  if (!currentMedia || !hasStartedPlayback || inlineVisible) return null;

  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isPlaying) pause();
      else await play();
    } catch (err) {
      console.error("[MiniPlayer] Play/Pause error:", err);
    }
  };

  const close = (e: React.MouseEvent) => {
    e.stopPropagation();
    closePlayer();
  };

  // Volta para o player completo (página inicial, rolando até a rádio)
  const openFullPlayer = () => {
    const scrollToPlayer = () =>
      document.querySelector("[data-inline-player]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (pathname === "/") scrollToPlayer();
    else {
      router.push("/");
      setTimeout(scrollToPlayer, 600);
    }
  };

  const status = loading ? "Conectando..." : isPlaying ? "Ao vivo" : "Pausado";

  return (
    <>
      {/* Espaço no fim da página para o miniplayer não cobrir o conteúdo (celular) */}
      {isMobile && <div aria-hidden className="h-16 shrink-0" />}

      <div
        role="button"
        tabIndex={0}
        aria-label={`Rádio ${currentMedia.title}. Toque para abrir o player`}
        onClick={openFullPlayer}
        onKeyDown={(e) => e.key === "Enter" && openFullPlayer()}
        className={
          isMobile
            ? "fixed left-0 right-0 z-40 cursor-pointer bg-background/98 backdrop-blur-md border-t border-border/60 shadow-[0_-4px_12px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-4 duration-200"
            : "fixed right-5 bottom-5 z-40 w-[340px] cursor-pointer rounded-xl overflow-hidden bg-background/98 backdrop-blur-md border border-border/60 shadow-2xl hover:shadow-xl animate-in slide-in-from-bottom-4 duration-200"
        }
        style={isMobile ? { bottom: navHeight } : undefined}
      >
        {/* Linha "ao vivo" no topo, como a barra de progresso do YouTube */}
        <div className="h-0.5 w-full bg-muted overflow-hidden">
          <div className={`h-full bg-red-500 ${isPlaying ? "w-full animate-pulse" : "w-0"}`} />
        </div>

        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-10 h-10 shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
            <Radio className={`w-5 h-5 text-primary ${isPlaying ? "animate-pulse" : ""}`} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{currentMedia.title}</p>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPlaying ? "bg-red-500" : "bg-muted-foreground"}`} />
              <span className="text-xs text-muted-foreground truncate">
                {status}
                {currentMedia.artist ? ` • ${currentMedia.artist}` : ""}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={togglePlay}
            disabled={loading}
            aria-label={isPlaying ? "Pausar" : "Tocar"}
            className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
            )}
          </button>

          {isRadioPipSupported() && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openFloatingRadio(currentMedia.title, currentMedia.artist, isPlaying);
              }}
              aria-label="Janela flutuante"
              title="Janela flutuante (continua aparecendo fora do app)"
              className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition"
            >
              <PictureInPicture2 className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={close}
            aria-label="Fechar rádio"
            className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
};

/** true enquanto o player da rádio da página inicial ([data-inline-player]) estiver visível na tela. */
function useInlinePlayerVisible() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let cancelled = false;
    // a página monta depois da navegação: tenta achar o elemento por alguns instantes
    const attach = (tries: number) => {
      if (cancelled) return;
      const el = document.querySelector("[data-inline-player]");
      if (!el) {
        if (tries > 0) setTimeout(() => attach(tries - 1), 200);
        else setVisible(false);
        return;
      }
      observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
      observer.observe(el);
    };
    attach(10);
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [pathname]);

  return visible;
}

/** Altura do menu inferior do celular (o miniplayer fica logo acima dele). */
function useBottomNavHeight(isMobile: boolean) {
  const [height, setHeight] = useState(76);

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("nav.fixed.bottom-0");
    if (!nav) {
      setHeight(0);
      return;
    }
    const update = () => setHeight(nav.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [isMobile]); // o menu inferior só existe no celular e monta depois da hidratação

  return height;
}

/** Abre a janela flutuante da rádio (a partir de um toque) e explica como usar. */
export async function openFloatingRadio(title: string, subtitle: string | null | undefined, playing: boolean) {
  try {
    await openRadioPip({ title, subtitle, playing });
    toast({ title: "Janela flutuante aberta", description: "Pode sair do app: a rádio continua tocando numa janelinha por cima dos outros apps." });
  } catch (err) {
    console.error("[RadioPiP]", err);
    toast({
      title: "Não foi possível abrir a janela flutuante",
      description: "Verifique se o Picture-in-Picture está permitido para o Chrome nas configurações do celular.",
      variant: "destructive",
    });
  }
}
