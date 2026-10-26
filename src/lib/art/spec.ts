// Artes para as redes sociais (feed, story, capa de reels) com a identidade visual da igreja.
// O mesmo desenho serve para o gerador do painel e para a imagem da postagem automática dos eventos.
import { z } from "zod";

export const ART_FORMATS = {
  feed: { label: "Feed (4:5)", width: 1080, height: 1350 },
  square: { label: "Quadrado (1:1)", width: 1080, height: 1080 },
  story: { label: "Story / Reels (9:16)", width: 1080, height: 1920 },
} as const;
export type ArtFormat = keyof typeof ART_FORMATS;

export const ART_TEMPLATES = {
  evento: { label: "Evento", description: "Título, data, horário, local e destaque" },
  versiculo: { label: "Versículo", description: "Texto bíblico com a referência" },
  aviso: { label: "Aviso", description: "Título e um texto curto" },
  capa: { label: "Capa (reels / story)", description: "Título grande no centro" },
} as const;
export type ArtTemplate = keyof typeof ART_TEMPLATES;

export interface ArtTheme {
  label: string;
  /** degradê do fundo (sem foto) */
  from: string;
  to: string;
  text: string;
  muted: string;
  accent: string;
  /** texto sobre o destaque (etiqueta, faixa) */
  onAccent: string;
  /** cor por cima da foto, para o texto ficar legível */
  shade: string;
}

export const ART_THEMES = {
  azul: { label: "Azul Mensageira", from: "#2A9BFF", to: "#0B4FA8", text: "#FFFFFF", muted: "#DCEBFF", accent: "#FFD54A", onAccent: "#0B3B7A", shade: "8, 38, 86" },
  dourado: { label: "Dourado", from: "#2B1D0E", to: "#70501F", text: "#FFF8E7", muted: "#EADCBC", accent: "#E8C26A", onAccent: "#2B1D0E", shade: "34, 22, 8" },
  noite: { label: "Noite", from: "#0B1530", to: "#1D3270", text: "#FFFFFF", muted: "#C9D6FF", accent: "#5EB4FF", onAccent: "#0B1530", shade: "6, 12, 32" },
  claro: { label: "Claro", from: "#FFFFFF", to: "#E3F0FF", text: "#0D2A55", muted: "#4A6585", accent: "#1E90FF", onAccent: "#FFFFFF", shade: "255, 255, 255" },
} satisfies Record<string, ArtTheme>;
export type ArtThemeId = keyof typeof ART_THEMES;

const text = (max: number) => z.string().trim().max(max).default("");

export const artSpecSchema = z.object({
  format: z.enum(Object.keys(ART_FORMATS) as [ArtFormat, ...ArtFormat[]]).default("feed"),
  template: z.enum(Object.keys(ART_TEMPLATES) as [ArtTemplate, ...ArtTemplate[]]).default("evento"),
  theme: z.enum(Object.keys(ART_THEMES) as [ArtThemeId, ...ArtThemeId[]]).default("azul"),
  tag: text(40), // etiqueta no alto (ex.: "EVENTO", "HOJE TEM")
  title: text(140),
  text: text(600), // texto do aviso / versículo / subtítulo da capa
  reference: text(80), // referência do versículo
  date: text(80),
  time: text(40),
  location: text(120),
  highlight: text(90), // faixa de destaque (ex.: "Inscrições abertas • R$ 20,00")
  photo: z
    .object({
      url: z.string().regex(/^\/(api\/images\/[0-9a-f-]{36}|images\/[a-z0-9._-]+)$/i, "foto inválida"),
      x: z.number().min(0).max(100).default(50),
      y: z.number().min(0).max(100).default(50),
    })
    .nullable()
    .default(null),
});
export type ArtSpec = z.infer<typeof artSpecSchema>;

/** "Domingo, 1 de novembro" → "Domingo, 1º de novembro" (primeiro dia do mês leva o º) */
export const ordinalFirstDay = (s: string) => s.replace(/(^|\s)1 de /, "$11º de ");

export const ART_DEFAULTS: Record<ArtTemplate, Partial<ArtSpec>> = {
  evento: { tag: "EVENTO", title: "Nome do evento", date: "Sábado, 10 de outubro", time: "19h30", location: "Igreja Mensageira de Deus Templo de Fé" },
  versiculo: {
    tag: "PALAVRA DO DIA",
    text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
    reference: "João 3:16",
  },
  aviso: { tag: "AVISO", title: "Título do aviso", text: "Escreva aqui o texto do aviso para a igreja." },
  capa: { tag: "", title: "Título do vídeo", text: "" },
};
