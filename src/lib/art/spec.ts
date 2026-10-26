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
  programacao: { label: "Programação", description: "Lista de cultos e eventos da semana ou do mês" },
  aniversariantes: { label: "Aniversariantes", description: "Aniversariantes do mês, puxados do cadastro" },
} as const;
export type ArtTemplate = keyof typeof ART_TEMPLATES;

export interface ArtTheme {
  label: string;
  /** cor lisa do fundo */
  bg: string;
  text: string;
  muted: string;
  accent: string;
}

export const ART_THEMES = {
  papel: { label: "Papel", bg: "#F7F4EE", text: "#1F1D1A", muted: "#6B655C", accent: "#A8834A" },
  branco: { label: "Branco", bg: "#FFFFFF", text: "#13233A", muted: "#5F6B7A", accent: "#1E90FF" },
  marinho: { label: "Marinho", bg: "#0F2742", text: "#F4F7FB", muted: "#A9BBD0", accent: "#8EC5FF" },
  grafite: { label: "Grafite", bg: "#161616", text: "#F2F2F2", muted: "#9A9A9A", accent: "#C9A96E" },
  areia: { label: "Areia", bg: "#E9E1D4", text: "#2F2619", muted: "#6E6150", accent: "#8A6A3F" },
} satisfies Record<string, ArtTheme>;
export type ArtThemeId = keyof typeof ART_THEMES;

/** Fundo: cor lisa (tema), foto limpa na parte de cima, ou imagem ocupando a arte toda. */
export const ART_BACKGROUNDS = {
  cor: { label: "Cor lisa" },
  foto: { label: "Foto em cima" },
  imagem: { label: "Imagem de fundo" },
} as const;
export type ArtBackground = keyof typeof ART_BACKGROUNDS;

/** Onde fica o texto quando a imagem ocupa o fundo todo. */
export const ART_POSITIONS = { topo: "Em cima", centro: "No meio", base: "Embaixo" } as const;
export type ArtPosition = keyof typeof ART_POSITIONS;

const text = (max: number) => z.string().trim().max(max).default("");

export const artSpecSchema = z.object({
  format: z.enum(Object.keys(ART_FORMATS) as [ArtFormat, ...ArtFormat[]]).default("feed"),
  template: z.enum(Object.keys(ART_TEMPLATES) as [ArtTemplate, ...ArtTemplate[]]).default("evento"),
  theme: z.enum(Object.keys(ART_THEMES) as [ArtThemeId, ...ArtThemeId[]]).default("papel"),
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
  background: z.enum(Object.keys(ART_BACKGROUNDS) as [ArtBackground, ...ArtBackground[]]).default("cor"),
  // só para "Imagem de fundo": onde vai o texto, alinhamento, cores das letras e quanto escurecer a imagem
  position: z.enum(Object.keys(ART_POSITIONS) as [ArtPosition, ...ArtPosition[]]).default("base"),
  align: z.enum(["left", "center"]).default("left"),
  textColor: z.string().regex(/^#[0-9a-f]{6}$/i).default("#FFFFFF"),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i).default("#E8C26A"),
  overlay: z.number().int().min(0).max(85).default(40),
  showLogo: z.boolean().default(true),
  // programação / aniversariantes: linhas da lista (ex.: "DOM 26" · "Culto da Família" · "19h")
  items: z
    .array(z.object({ label: text(20), title: text(80), detail: text(30) }))
    .max(12)
    .default([]),
  // carrossel: número da página ("2/5"), no canto de baixo
  page: text(10),
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
  programacao: {
    tag: "PROGRAMAÇÃO DA SEMANA",
    title: "Esta semana",
    items: [
      { label: "QUA", title: "Culto de Oração", detail: "19h30" },
      { label: "SEX", title: "Culto de Cura e Libertação", detail: "20h" },
      { label: "DOM", title: "Culto da Família", detail: "19h" },
    ],
  },
  aniversariantes: { tag: "ANIVERSARIANTES", title: "Novembro", text: "Parabéns! Que Deus abençoe a sua vida.", items: [] },
};
