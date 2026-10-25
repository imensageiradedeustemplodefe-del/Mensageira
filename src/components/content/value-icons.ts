import { BookOpen, Church, Cross, Eye, Flame, HandHeart, Heart, Music, Sparkles, Star, Target, Users2, type LucideIcon } from "lucide-react";
import type { ValueIcon } from "@/lib/about-content";

/** Ícones que podem ser escolhidos para os valores da página Sobre. */
export const VALUE_ICON_COMPONENTS: Record<ValueIcon, { icon: LucideIcon; label: string }> = {
  heart: { icon: Heart, label: "Coração" },
  target: { icon: Target, label: "Alvo" },
  eye: { icon: Eye, label: "Olho" },
  users: { icon: Users2, label: "Pessoas" },
  star: { icon: Star, label: "Estrela" },
  book: { icon: BookOpen, label: "Bíblia" },
  hands: { icon: HandHeart, label: "Mãos" },
  flame: { icon: Flame, label: "Chama" },
  church: { icon: Church, label: "Igreja" },
  music: { icon: Music, label: "Música" },
  sparkles: { icon: Sparkles, label: "Brilho" },
  cross: { icon: Cross, label: "Cruz" },
};
