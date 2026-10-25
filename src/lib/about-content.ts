// Listas da página Sobre, editáveis no painel. Ficam como JSON nas configurações (about_values, about_pastors,
// about_ministries); sem valor salvo, valem as listas abaixo (o que já aparecia no site).

/** Foto com enquadramento: o ponto (x, y em %) fica no centro do círculo e o zoom aproxima nele. */
export interface Photo {
  url: string;
  x: number;
  y: number;
  zoom: number;
  /** largura/altura da imagem (para enquadrar sem sobra); sem valor, é lida ao carregar */
  ratio?: number;
}

export interface Pastor {
  name: string;
  role: string;
  description: string;
  photo: Photo | null;
}

export interface Ministry {
  name: string;
  type: string;
  leaders: string;
  icon: string; // emoji
}

export interface ValueItem {
  icon: ValueIcon;
  title: string;
  description: string;
}

export const VALUE_ICONS = ["heart", "target", "eye", "users", "star", "book", "hands", "flame", "church", "music", "sparkles", "cross"] as const;
export type ValueIcon = (typeof VALUE_ICONS)[number];

const photo = (url: string): Photo => ({ url, x: 50, y: 50, zoom: 1, ratio: 1 });

export const DEFAULT_PASTORS: Pastor[] = [
  {
    name: "Profeta João",
    role: "Profeta (em memória)",
    description:
      "Era a base e o alicerce de nossa igreja. Mesmo não estando mais entre nós, sua influência e ensinamentos continuam guiando nossa comunidade de fé.",
    photo: null,
  },
  {
    name: "Pra. Vera Lucia",
    role: "Pastora Responsável",
    description: "Lidera a igreja juntamente com o Pastor Gilmar, atuando especialmente na área de libertação.",
    photo: photo("/images/pastora-vera.png"),
  },
  {
    name: "Pr. Gilmar Radaelli",
    role: "Pastor Responsável",
    description: "Lidera a igreja em conjunto com a Pastora Vera, atuando especialmente na área de prosperidade.",
    photo: photo("/images/pastor-gilmar.png"),
  },
  {
    name: "Pr. João Batista",
    role: "Pastor Auxiliar",
    description: "Dá suporte aos pastores responsáveis, atuando especialmente na área de ensinamento bíblico.",
    photo: photo("/images/pastor-joao.png"),
  },
  {
    name: "Pr. Daniel Ribas",
    role: "Pastor Auxiliar",
    description: "Auxilia os pastores responsáveis no cuidado pastoral e na condução dos cultos e da congregação.",
    photo: null,
  },
  {
    name: "Pr. Ademar Malmann",
    role: "Pastor Auxiliar",
    description: "Auxilia os pastores responsáveis, com atuação especial no ministério de oração Guerreiros de Fé.",
    photo: null,
  },
  {
    name: "Pr. Odirlei Segatto",
    role: "Pastor Auxiliar",
    description: "Auxilia os pastores responsáveis no cuidado pastoral e no acompanhamento das famílias da igreja.",
    photo: null,
  },
  {
    name: "Pr. João Leno",
    role: "Pastor Auxiliar",
    description: "Auxilia os pastores responsáveis no cuidado pastoral e nas atividades da congregação.",
    photo: null,
  },
];

export const DEFAULT_MINISTRIES: Ministry[] = [
  { name: "Geração de Samuel", leaders: "André Dale Laste e Silvano Cardoso", type: "Grupo De Louvor", icon: "🎵" },
  { name: "Jovens Adoradores", leaders: "Silvano e Leonice Cardoso", type: "Grupo De Jovens", icon: "👥" },
  { name: "Mirian's", leaders: "Leonice Cardoso", type: "Grupo De Meninas", icon: "🩰" },
  { name: "Guerreiros De Fé", leaders: "Márcia e Ademar Malmann", type: "Grupo De Oração", icon: "🙏" },
  { name: "Palavra Viva", leaders: "Jessica Vacelkoski e Elisa Maria", type: "Mídia", icon: "📱" },
  { name: "Ourinhos de Cristo", leaders: "Leonice Cardoso", type: "Grupo De Crianças", icon: "👶" },
  { name: "Escolinha", leaders: "Adriana e Julia Santos", type: "Ministério Infantil", icon: "🎒" },
  { name: "Nova Geração Kids", leaders: "Daniela Azeredo", type: "Grupo De Crianças", icon: "👶" },
  { name: "Mensageiras Do Cristo Rei", leaders: "Ana Venconi", type: "Grupo De Mulheres", icon: "👩" },
];

export const DEFAULT_VALUES: ValueItem[] = [
  { icon: "heart", title: "Amor", description: "O amor de Cristo é o centro de tudo que fazemos, servindo uns aos outros com compaixão." },
  { icon: "target", title: "Missão", description: "Proclamar o evangelho de Jesus Cristo e fazer discípulos em nossa comunidade e além." },
  { icon: "eye", title: "Visão", description: "Ser uma igreja transformadora que impacta vidas através da Palavra de Deus." },
  { icon: "users", title: "Comunidade", description: "Cultivar relacionamentos genuínos e apoio mútuo entre os irmãos na fé." },
];

/** Lê uma lista salva (JSON); se estiver vazia ou estragada, usa a padrão. */
export function parseList<T>(raw: string | null | undefined, fallback: T[]): T[] {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : fallback;
  } catch {
    return fallback;
  }
}
