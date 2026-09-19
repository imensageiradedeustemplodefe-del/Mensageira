"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Download, Share2, ChevronLeft, ChevronRight, Facebook, MessageCircle, Heart, HandHeart, Flame, Sparkles, Bird } from "lucide-react";
import { toast } from "sonner";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/lib/fetcher";

interface Photo {
  id: string;
  name: string;
  thumbUrl: string;
  viewUrl: string;
  createdTime: string;
  mimeType?: string;
}

const isVideo = (p: Photo) =>
  (p.mimeType ?? "").startsWith("video/") || /\.(mp4|mov|m4v|avi|mkv|webm|3gp|wmv)$/i.test(p.name);

const stripExt = (name: string) => name.replace(/\.(jpg|jpeg|png|gif|webp|heic|mp4|mov|m4v|avi|mkv|webm|3gp|wmv)$/i, "");

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  albumDate?: string;
}

type ReactionType = "love" | "prayer" | "amen" | "hallelujah" | "glory" | "fire";

type Reactions = Record<ReactionType, number>;

const EMPTY: Reactions = { love: 0, prayer: 0, amen: 0, hallelujah: 0, glory: 0, fire: 0 };

const getUserId = () => {
  let userId = localStorage.getItem("photo_user_id");
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("photo_user_id", userId);
  }
  return userId;
};

const getReactionsMap = (): Record<string, ReactionType> => {
  try {
    return JSON.parse(localStorage.getItem("photo_reactions") || "{}");
  } catch {
    return {};
  }
};

export function PhotoLightbox({ photos, initialIndex, isOpen, onClose, albumDate }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [reactions, setReactions] = useState<Reactions>(EMPTY);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const fetchReactions = useCallback(async (photoId: string) => {
    try {
      const counts = await api<{ reaction_type: string; reaction_count: number }[]>(
        `/api/reactions?photoId=${encodeURIComponent(photoId)}`
      );
      const next = { ...EMPTY };
      counts.forEach((r) => {
        if (r.reaction_type in next) next[r.reaction_type as ReactionType] = Number(r.reaction_count) || 0;
      });
      setReactions(next);
      setUserReaction(getReactionsMap()[photoId] ?? null);
    } catch (error) {
      console.error("Error fetching reactions:", error);
      setReactions(EMPTY);
      setUserReaction(null);
    }
  }, []);

  useEffect(() => {
    if (currentPhoto?.id) fetchReactions(currentPhoto.id);
  }, [currentPhoto?.id, fetchReactions]);

  const handleReaction = async (type: ReactionType) => {
    try {
      const userId = getUserId();
      const reactionsMap = getReactionsMap();

      if (userReaction === type) {
        await api("/api/reactions", { method: "DELETE", json: { photo_id: currentPhoto.id, user_id: userId } });
        delete reactionsMap[currentPhoto.id];
        localStorage.setItem("photo_reactions", JSON.stringify(reactionsMap));
        setUserReaction(null);
        toast.success("Reação removida");
      } else {
        await api("/api/reactions", {
          method: "POST",
          json: { photo_id: currentPhoto.id, user_id: userId, reaction_type: type },
        });
        reactionsMap[currentPhoto.id] = type;
        localStorage.setItem("photo_reactions", JSON.stringify(reactionsMap));
        setUserReaction(type);

        const messages: Record<ReactionType, string> = {
          love: "Amei! ❤️",
          prayer: "Oração enviada 🙏",
          amen: "Amém! 🙌",
          hallelujah: "Aleluia! 🕊️",
          glory: "Glória a Deus! ⭐",
          fire: "Aviva Senhor! 🔥",
        };
        toast.success(messages[type]);
      }
      await fetchReactions(currentPhoto.id);
    } catch (error) {
      console.error("Error handling reaction:", error);
      toast.error("Erro ao processar reação");
    }
  };

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrevious, handleNext]);

  const handleDownload = () => {
    // Link de download do Drive (arquivo original). O navegador baixa direto; se bloquear, abre em nova aba.
    const url = `https://drive.google.com/uc?id=${currentPhoto.id}&export=download`;
    const link = document.createElement("a");
    link.href = url;
    link.download = currentPhoto.name || "foto.jpg";
    link.rel = "noopener";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(video ? "Download do vídeo iniciado!" : "Download iniciado!");
  };

  const handleShareWhatsApp = () => {
    const text = `${video ? "Confira este vídeo" : "Confira esta foto"}: ${stripExt(currentPhoto.name)}`;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}%20${url}`, "_blank");
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado!");
  };

  if (!currentPhoto) return null;

  // Fontes em ordem de preferência (todas em resolução total; a primeira usa o mesmo host das miniaturas)
  const imageSources = [
    `https://drive.google.com/thumbnail?id=${currentPhoto.id}&sz=w2560`,
    `https://lh3.googleusercontent.com/d/${currentPhoto.id}=s0`,
    currentPhoto.viewUrl || `https://drive.google.com/uc?id=${currentPhoto.id}&export=view`,
  ];
  const fullSizeImageUrl = imageSources[0];
  const video = isVideo(currentPhoto);

  const reactionButtons: { type: ReactionType; title: string; icon: React.ReactNode }[] = [
    { type: "love", title: "Amei", icon: <Heart className={`w-4 h-4 ${userReaction === "love" ? "fill-red-500 text-red-500" : ""}`} /> },
    { type: "prayer", title: "Oração", icon: <HandHeart className={`w-4 h-4 ${userReaction === "prayer" ? "fill-blue-500 text-blue-500" : ""}`} /> },
    { type: "amen", title: "Amém", icon: <span className={`text-base ${userReaction === "amen" ? "scale-125" : ""}`}>🙌</span> },
    { type: "hallelujah", title: "Aleluia", icon: <Bird className={`w-4 h-4 ${userReaction === "hallelujah" ? "fill-white text-white" : ""}`} /> },
    { type: "glory", title: "Glória a Deus", icon: <Sparkles className={`w-4 h-4 ${userReaction === "glory" ? "fill-yellow-400 text-yellow-400" : ""}`} /> },
    { type: "fire", title: "Aviva Senhor", icon: <Flame className={`w-4 h-4 ${userReaction === "fire" ? "fill-orange-500 text-orange-500" : ""}`} /> },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[96vw] sm:max-w-7xl w-full h-[92vh] p-0 gap-0 overflow-hidden bg-black/98 backdrop-blur-sm [&>button]:hidden">
        <VisuallyHidden.Root>
          <DialogTitle>Visualizador de Foto</DialogTitle>
          <DialogDescription>
            Foto {currentIndex + 1} de {photos.length}: {currentPhoto.name}
          </DialogDescription>
        </VisuallyHidden.Root>

        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h3 className="font-semibold text-lg truncate max-w-md">
                {stripExt(currentPhoto.name)}
              </h3>
              {albumDate && <p className="text-sm text-white/70">{albumDate}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-2 pt-16 pb-28 sm:px-16 sm:pt-20 sm:pb-32">
          {video ? (
            // Player do Google Drive (funciona para qualquer formato que o Drive consiga reproduzir)
            <iframe
              key={currentPhoto.id}
              src={`https://drive.google.com/file/d/${currentPhoto.id}/preview`}
              title={currentPhoto.name}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full max-w-5xl rounded-lg bg-black animate-fade-in"
            />
          ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={currentPhoto.id}
            src={fullSizeImageUrl}
            alt={currentPhoto.name}
            className="block w-auto h-auto max-w-full max-h-full object-contain animate-fade-in select-none"
            loading="eager"
            onError={(e) => {
              // Tenta a próxima fonte quando a atual falha
              const target = e.target as HTMLImageElement;
              const idx = Number(target.dataset.fallback ?? 0) + 1;
              if (idx < imageSources.length) {
                target.dataset.fallback = String(idx);
                target.src = imageSources[idx];
              }
            }}
          />
          )}
        </div>

        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12 rounded-full"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12 rounded-full"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 to-transparent p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {reactionButtons.map((r) => (
                <Button
                  key={r.type}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(r.type)}
                  className={`text-white hover:bg-white/20 gap-1.5 ${userReaction === r.type ? "bg-white/20" : ""}`}
                  title={r.title}
                >
                  {r.icon}
                  <span className="text-xs">{reactions[r.type]}</span>
                </Button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-white/70 text-sm">
                {currentIndex + 1} / {photos.length}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleShareWhatsApp} className="text-white hover:bg-white/20" title="Compartilhar no WhatsApp">
                  <MessageCircle className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleShareFacebook} className="text-white hover:bg-white/20" title="Compartilhar no Facebook">
                  <Facebook className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCopyLink} className="text-white hover:bg-white/20" title="Copiar link">
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDownload} className="text-white hover:bg-white/20" title={video ? "Baixar vídeo" : "Baixar foto"}>
                  <Download className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
