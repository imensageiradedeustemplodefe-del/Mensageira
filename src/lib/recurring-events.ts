// Programação fixa da igreja, usada pelo botão "Gerar eventos fixos do ano" do painel.
// Eventos que não são fixos (Chá das Mulheres, conferências...) continuam sendo cadastrados à mão.

export const CHURCH_LOCATION = "Igreja Mensageira de Deus Templo de Fé";

export interface RecurringRule {
  title: string;
  /** 0 = domingo ... 6 = sábado */
  weekday: number;
  /** n-ésima ocorrência do dia da semana no mês (1 = primeiro). null = toda semana */
  nth: number | null;
  /** pula esta ocorrência (ex.: no 2º domingo tem Santa Ceia em vez do Culto da Família) */
  skipNth?: number;
  time: string; // HH:mm (horário de Brasília)
  category: string;
  description: string;
}

export const RECURRING_RULES: RecurringRule[] = [
  {
    title: "Culto de Cura e Libertação",
    weekday: 5,
    nth: null,
    time: "20:00",
    category: "culto",
    description: "Noite de oração especial para cura física, emocional e espiritual. Venha buscar a libertação em Jesus Cristo.",
  },
  {
    title: "Culto da Família",
    weekday: 0,
    nth: null,
    skipNth: 2,
    time: "19:30",
    category: "culto",
    description: "Culto especial para toda a família, com mensagens edificantes e momentos de adoração em comunidade.",
  },
  {
    title: "Santa Ceia",
    weekday: 0,
    nth: 2,
    time: "19:30",
    category: "ceia",
    description: "Celebração da Santa Ceia do Senhor, momento sagrado de comunhão e renovação espiritual.",
  },
  {
    title: "Louvorzão dos Jovens",
    weekday: 6,
    nth: 1,
    time: "19:30",
    category: "jovens",
    description: "Noite especial de louvor e adoração com os jovens. Venha participar desse momento de celebração!",
  },
  {
    title: "Preparação para Santa Ceia",
    weekday: 6,
    nth: 2,
    time: "19:30",
    category: "culto",
    description: "Reunião de preparação espiritual para a celebração da Santa Ceia. Momento de reflexão e consagração.",
  },
  {
    title: "Lavacar",
    weekday: 6,
    nth: 3,
    time: "08:00",
    category: "lavacar",
    description: "Evento de lavagem de carros em prol da igreja. Venha apoiar e participar desse momento de comunhão!",
  },
];

export const WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** Texto curto da regra, ex.: "Toda sexta às 20:00" / "2º domingo do mês às 19:30". */
export function describeRule(r: RecurringRule) {
  const day = WEEKDAYS[r.weekday];
  if (r.nth === null) return `Todo(a) ${day}${r.skipNth ? ` (exceto o ${r.skipNth}º do mês)` : ""} às ${r.time}`;
  return `${r.nth}º ${day} do mês às ${r.time}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Todas as ocorrências de um ano (a partir de `from`, se informado). Datas em UTC equivalentes a Brasília (-03:00). */
export function planYear(year: number, from?: Date) {
  const out: { rule: RecurringRule; date: Date }[] = [];
  for (let m = 0; m < 12; m++) {
    const days = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
    for (let d = 1; d <= days; d++) {
      const weekday = new Date(Date.UTC(year, m, d)).getUTCDay();
      const nth = Math.ceil(d / 7);
      for (const rule of RECURRING_RULES) {
        if (rule.weekday !== weekday) continue;
        if (rule.nth !== null && rule.nth !== nth) continue;
        if (rule.skipNth && rule.skipNth === nth) continue;
        const date = new Date(`${year}-${pad(m + 1)}-${pad(d)}T${rule.time}:00-03:00`);
        if (from && date < from) continue;
        out.push({ rule, date });
      }
    }
  }
  return out;
}
