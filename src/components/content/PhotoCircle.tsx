"use client";

import { useState } from "react";
import type { Photo } from "@/lib/about-content";
import { cn } from "@/lib/utils";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Foto redonda com o enquadramento escolhido no painel: o ponto (x, y, em % da foto) fica no centro do círculo,
 * com o zoom pedido, sem deixar sobra vazia. Sem foto, mostra o logo.
 */
export function PhotoCircle({ photo, alt, className }: { photo: Photo | null; alt: string; className?: string }) {
  // proporção (largura/altura): vem salva com a foto; se faltar, lê da imagem ao carregar
  const [loadedRatio, setLoadedRatio] = useState<number | null>(null);
  const ratio = photo?.ratio || loadedRatio || 1;
  const zoom = Math.max(1, photo?.zoom || 1);

  let style: React.CSSProperties | undefined;
  if (photo) {
    // tamanho da imagem em % do círculo: o lado menor cobre o círculo inteiro (× zoom)
    const w = zoom * 100 * Math.max(ratio, 1);
    const h = zoom * 100 * Math.max(1 / ratio, 1);
    style = {
      position: "absolute",
      width: `${w}%`,
      height: `${h}%`,
      maxWidth: "none",
      left: `${clamp(50 - (photo.x * w) / 100, 100 - w, 0)}%`,
      top: `${clamp(50 - (photo.y * h) / 100, 100 - h, 0)}%`,
    };
  }

  return (
    <div className={cn("relative rounded-full overflow-hidden bg-muted", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo?.url || "/images/logo-icon.png"}
        alt={alt}
        loading="lazy"
        className={photo ? undefined : "absolute inset-0 w-full h-full object-cover"}
        style={style}
        onLoad={(e) => {
          if (photo && !photo.ratio && e.currentTarget.naturalHeight) setLoadedRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight);
        }}
      />
    </div>
  );
}
