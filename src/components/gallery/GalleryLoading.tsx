"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";

const MESSAGES = [
  "Carregando momentos especiais…",
  "Revelando as fotos…",
  "Separando os melhores sorrisos…",
  "Relembrando cada detalhe…",
  "Quase lá, só mais um instante…",
];

/** Brilho que atravessa o bloco enquanto a imagem não chega. */
export function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 dark:via-white/10 to-transparent" />
    </div>
  );
}

/** Aviso animado + grade de "fotos fantasma" enquanto o álbum carrega do Google Drive. */
export function GalleryLoading({ count = 8, title }: { count?: number; title?: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % MESSAGES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mb-8" role="status" aria-live="polite">
      <div className="flex flex-col items-center text-center py-6 sm:py-8">
        <div className="relative w-16 h-16 mb-4">
          <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <span className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-6 h-6 text-primary" />
          </span>
        </div>
        <p key={i} className="text-base sm:text-lg font-medium text-foreground animate-message-in">
          {MESSAGES[i]}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{title ? `Buscando as fotos de “${title}”` : "As fotos vêm direto do nosso acervo"}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: count }).map((_, n) => (
          <div key={n} className="rounded-xl overflow-hidden border border-border/50" style={{ animationDelay: `${n * 80}ms` }}>
            <Shimmer className="aspect-[3/4]" />
            <div className="p-3 space-y-2">
              <Shimmer className="h-3.5 w-2/3 rounded" />
              <Shimmer className="h-3 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Miniatura com brilho de carregamento; a foto aparece suavemente quando termina de baixar. */
export function PhotoThumb({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <Shimmer className="absolute inset-0" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        ref={(el) => {
          // imagem já em cache: o onLoad pode não disparar
          if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`${className} transition-all duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}
