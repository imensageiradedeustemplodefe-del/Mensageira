"use client";

import { useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Globe, Heart, MessageCircle, MoreHorizontal, Send, Share2, ThumbsUp } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

// Simulação de como o post aparece no Instagram e no Facebook, para conferir antes de publicar.
// As cores imitam o tema claro dos apps (independente do tema do painel).

type Network = "instagram" | "facebook";

/** Hashtags, @menções e links em azul, como nos apps. */
function RichText({ text, color }: { text: string; color: string }) {
  const parts = text.split(/((?:#|@)[\p{L}\p{N}_.]+|https?:\/\/\S+)/u);
  return (
    <>
      {parts.map((p, i) =>
        /^(#|@|https?:\/\/)/.test(p) ? (
          <span key={i} style={{ color }}>
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}

/** Corta a legenda como o app faz antes do "mais" (n caracteres ou n linhas). */
function cut(text: string, chars: number, lines: number) {
  const byLines = text.split("\n").slice(0, lines).join("\n");
  const short = byLines.length > chars ? byLines.slice(0, chars).replace(/\s+\S*$/, "") : byLines;
  return short.length < text.trim().length ? short.trimEnd() : null;
}

function Avatar({ size, ring }: { size: number; ring?: boolean }) {
  return (
    <span
      className={cn("shrink-0 rounded-full bg-white flex items-center justify-center overflow-hidden", ring && "p-[2px]")}
      style={{ width: size, height: size, background: ring ? "linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)" : undefined }}
    >
      <span className="block w-full h-full rounded-full bg-white overflow-hidden border border-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-icon.png" alt="" className="w-full h-full object-contain" />
      </span>
    </span>
  );
}

/** Imagem (ou carrossel de imagens) com setas e bolinhas. */
function Media({ images, ratio }: { images: (string | null)[]; ratio: number }) {
  const [i, setI] = useState(0);
  const n = images.length;
  const at = Math.min(i, n - 1);
  return (
    <div>
      <div className="relative bg-neutral-100" style={{ aspectRatio: String(ratio) }}>
        {images[at] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[at]!} alt="Imagem do post" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="absolute inset-0 animate-pulse bg-neutral-200" />
        )}
        {n > 1 && (
          <>
            <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
              {at + 1}/{n}
            </span>
            {at > 0 && (
              <button type="button" onClick={() => setI(at - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow min-h-0 min-w-0" aria-label="Imagem anterior">
                <ChevronLeft className="w-4 h-4 text-neutral-800" />
              </button>
            )}
            {at < n - 1 && (
              <button type="button" onClick={() => setI(at + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow min-h-0 min-w-0" aria-label="Próxima imagem">
                <ChevronRight className="w-4 h-4 text-neutral-800" />
              </button>
            )}
          </>
        )}
      </div>
      {n > 1 && (
        <div className="flex justify-center gap-1 pt-2">
          {images.map((_, k) => (
            <span key={k} className={cn("h-1.5 w-1.5 rounded-full", k === at ? "bg-[#0095f6]" : "bg-neutral-300")} />
          ))}
        </div>
      )}
    </div>
  );
}

function InstagramPost({ handle, images, ratio, caption }: { handle: string; images: (string | null)[]; ratio: number; caption: string }) {
  const [open, setOpen] = useState(false);
  const short = cut(caption, 125, 2);
  return (
    <div className="bg-white text-[#000] text-[14px] leading-[18px] font-sans">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Avatar size={32} ring />
        <span className="font-semibold text-[14px]">{handle}</span>
        <MoreHorizontal className="ml-auto w-5 h-5" />
      </div>
      <Media images={images} ratio={ratio} />
      <div className="flex items-center gap-4 px-3 pt-3 pb-1">
        <Heart className="w-6 h-6" />
        <MessageCircle className="w-6 h-6 -scale-x-100" />
        <Send className="w-6 h-6" />
        <Bookmark className="ml-auto w-6 h-6" />
      </div>
      <div className="px-3 pb-3 pt-1 space-y-1">
        {caption.trim() && (
          <p className="whitespace-pre-line break-words">
            <span className="font-semibold mr-1">{handle}</span>
            <RichText text={open || !short ? caption.trim() : short} color="#00376b" />
            {short && !open && (
              <button type="button" onClick={() => setOpen(true)} className="text-neutral-500 min-h-0 min-w-0">
                {"… mais"}
              </button>
            )}
          </p>
        )}
        <p className="text-[11px] uppercase tracking-wide text-neutral-500">Agora mesmo</p>
      </div>
    </div>
  );
}

function FacebookPost({ page, images, ratio, caption }: { page: string; images: (string | null)[]; ratio: number; caption: string }) {
  const [open, setOpen] = useState(false);
  const short = cut(caption, 230, 5);
  return (
    <div className="bg-white text-[#050505] text-[15px] leading-[20px] font-sans">
      <div className="flex items-center gap-2 px-3 pt-3">
        <Avatar size={40} />
        <div className="min-w-0">
          <p className="font-semibold text-[15px] truncate">{page}</p>
          <p className="flex items-center gap-1 text-[13px] text-[#65676b]">
            Agora · <Globe className="w-3 h-3" />
          </p>
        </div>
        <MoreHorizontal className="ml-auto w-5 h-5 text-[#65676b]" />
      </div>
      {caption.trim() && (
        <p className="px-3 pt-2 pb-3 whitespace-pre-line break-words">
          <RichText text={open || !short ? caption.trim() : short} color="#216fdb" />
          {short && !open && (
            <>
              {"… "}
              <button type="button" onClick={() => setOpen(true)} className="font-semibold min-h-0 min-w-0">
                Ver mais
              </button>
            </>
          )}
        </p>
      )}
      <Media images={images} ratio={ratio} />
      <div className="mx-3 mt-1 border-t border-[#ced0d4] grid grid-cols-3 text-[15px] font-semibold text-[#65676b]">
        {[
          [ThumbsUp, "Curtir"],
          [MessageCircle, "Comentar"],
          [Share2, "Compartilhar"],
        ].map(([Icon, label]) => {
          const I = Icon as typeof ThumbsUp;
          return (
            <span key={label as string} className="flex items-center justify-center gap-1.5 py-2">
              <I className="w-[18px] h-[18px]" /> <span className="hidden sm:inline">{label as string}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Story({ name, image, network }: { name: string; image: string | null; network: Network }) {
  return (
    <div className="relative mx-auto overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: "9 / 16", maxHeight: "calc(100vh - 16rem)", minHeight: 360 }}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="Imagem do story" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <span className="absolute inset-0 animate-pulse bg-neutral-800" />
      )}
      <div className="absolute inset-x-0 top-0 p-2.5 space-y-2 bg-gradient-to-b from-black/50 to-transparent">
        <div className="h-0.5 rounded bg-white/40 overflow-hidden">
          <div className="h-full w-1/3 bg-white" />
        </div>
        <div className="flex items-center gap-2 text-white text-[13px]">
          <Avatar size={28} />
          <span className="font-semibold truncate">{name}</span>
          <span className="text-white/70">agora</span>
          <MoreHorizontal className="ml-auto w-5 h-5" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-3 bg-gradient-to-t from-black/50 to-transparent">
        <span className="flex-1 rounded-full border border-white/70 px-4 py-2 text-[13px] text-white/90">{network === "instagram" ? "Enviar mensagem" : "Responder…"}</span>
        <Heart className="w-6 h-6 text-white" />
        <Send className="w-6 h-6 text-white" />
      </div>
    </div>
  );
}

/**
 * Prévia do post: alterna entre Instagram e Facebook. `images` com mais de uma imagem vira carrossel;
 * `story` mostra no formato de tela cheia (sem legenda, como nos apps).
 */
export function PostPreview({ images, ratio, caption, story = false }: { images: (string | null)[]; ratio: number; caption: string; story?: boolean }) {
  const { settings, raw } = useSiteSettings();
  const [net, setNet] = useState<Network>("instagram");
  const igUrl = raw.instagram_url || settings.instagram_url || "";
  const handle = igUrl.match(/instagram\.com\/([A-Za-z0-9_.]+)/)?.[1] ?? "igrejamensageira";
  const page = (settings.church_name || "Igreja Mensageira de Deus").replace(/\s+-\s+/, " ");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-full border bg-muted p-0.5 text-sm" role="tablist" aria-label="Prévia em">
          {(["instagram", "facebook"] as const).map((n) => (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={net === n}
              onClick={() => setNet(n)}
              className={cn("rounded-full px-3 py-1 font-medium min-h-0 transition-colors", net === n ? "bg-background shadow-sm" : "text-muted-foreground")}
            >
              {n === "instagram" ? "Instagram" : "Facebook"}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">Prévia de como vai aparecer</span>
      </div>
      <div className={cn("mx-auto w-full rounded-xl border shadow-sm overflow-hidden bg-white", story ? "max-w-[300px] border-0 shadow-none bg-transparent" : "max-w-[420px]")}>
        {story ? (
          <Story name={net === "instagram" ? handle : page} image={images[0] ?? null} network={net} />
        ) : net === "instagram" ? (
          <InstagramPost handle={handle} images={images} ratio={ratio} caption={caption} />
        ) : (
          <FacebookPost page={page} images={images} ratio={ratio} caption={caption} />
        )}
      </div>
      {net === "instagram" && !story && /https?:\/\//.test(caption) && (
        <p className="mx-auto max-w-[420px] text-xs text-amber-700 dark:text-amber-400">
          No Instagram, link na legenda não abre (só no Facebook). Se quiser, troque por “link na bio”.
        </p>
      )}
    </div>
  );
}
