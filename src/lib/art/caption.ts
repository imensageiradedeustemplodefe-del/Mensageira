// Legenda pronta para o post. Não repete o que já está na arte (data, horário, local, lista):
// traz um texto curto ligado ao tema, um versículo e o convite. Cada arte tem algumas opções
// ("Outra sugestão" no painel alterna entre elas).
import type { ArtSpec } from "@/lib/art/spec";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://imensageiradedeus.com.br").replace(/\/$/, "");

interface Theme {
  texts: string[];
  verse: string;
}

// Textos por tema do evento (categoria do evento ou palavra no título)
const THEMES: Record<string, Theme> = {
  culto: {
    texts: [
      "Existe um lugar onde a sua alma encontra descanso: na presença de Deus. Venha adorar com a gente! 🙌",
      "Deus tem uma palavra preparada para você. Venha celebrar, adorar e ser renovado na presença do Senhor.",
      "Não há nada melhor do que estar na casa do Pai. Chame alguém e venha também! ❤️",
    ],
    verse: "“Alegrei-me quando me disseram: Vamos à casa do Senhor.” — Salmos 122:1",
  },
  batismo: {
    texts: [
      "O batismo é a declaração pública de uma vida nova em Cristo. Que alegria celebrar esse passo de fé! 🕊️",
      "Uma decisão que muda tudo: morrer para a velha vida e nascer de novo em Jesus. Venha celebrar com a gente!",
      "Se você deseja dar esse passo de fé, este é o seu momento. Fale com a liderança e venha! 💧",
    ],
    verse: "“Quem crer e for batizado será salvo.” — Marcos 16:16",
  },
  ceia: {
    texts: [
      "Um momento de comunhão, gratidão e memória do sacrifício de Jesus por nós. Prepare o seu coração. 🍞🍷",
      "Na mesa do Senhor lembramos que fomos amados até o fim. Venha participar da Santa Ceia!",
    ],
    verse: "“Fazei isto em memória de mim.” — Lucas 22:19",
  },
  jovens: {
    texts: [
      "Uma geração que não se envergonha do Evangelho! Chama a galera e vem com a gente. 🔥",
      "Louvor, palavra e comunhão: é tempo de viver a juventude para Jesus. Te esperamos!",
      "Traz um amigo! Tem lugar pra todo mundo que quer conhecer mais de Deus. 🙌",
    ],
    verse: "“Ninguém despreze a tua mocidade.” — 1 Timóteo 4:12",
  },
  familia: {
    texts: [
      "A família é projeto de Deus. Venha com os seus e viva um tempo especial na presença do Senhor. 👨‍👩‍👧‍👦",
      "Lares firmes na Rocha: esse é o nosso desejo para a sua casa. Traga toda a família!",
    ],
    verse: "“Eu e a minha casa serviremos ao Senhor.” — Josué 24:15",
  },
  mulheres: {
    texts: [
      "Mulheres que oram, que amam e que vivem a Palavra. Venha viver esse tempo especial com a gente! 🌷",
      "Um encontro preparado com carinho para você. Traga uma amiga!",
    ],
    verse: "“Força e dignidade são os seus vestidos.” — Provérbios 31:25",
  },
  homens: {
    texts: [
      "Homens firmes na fé, sacerdotes do seu lar. Venha fortalecer a caminhada com a gente!",
      "Um tempo de palavra, oração e comunhão entre irmãos. Chame um amigo!",
    ],
    verse: "“Sede fortes, portai-vos varonilmente.” — 1 Coríntios 16:13",
  },
  criancas: {
    texts: [
      "Os pequenos também têm lugar especial na casa de Deus! Traga as crianças. 🧒👧",
      "Ensinar a Palavra desde cedo é plantar para a eternidade. Venha com os pequenos!",
    ],
    verse: "“Deixai vir a mim as crianças.” — Mateus 19:14",
  },
  oracao: {
    texts: [
      "A oração move o coração de Deus e transforma a nossa vida. Venha clamar com a gente! 🙏",
      "Tem algo pesando no seu coração? Traga para o altar. Vamos orar juntos.",
    ],
    verse: "“Orai sem cessar.” — 1 Tessalonicenses 5:17",
  },
  estudo: {
    texts: [
      "Conhecer a Palavra é conhecer o coração de Deus. Traga sua Bíblia e venha aprender com a gente! 📖",
      "Um tempo para crescer na fé e firmar a caminhada nas Escrituras. Te esperamos!",
    ],
    verse: "“Lâmpada para os meus pés é a tua palavra.” — Salmos 119:105",
  },
  louvor: {
    texts: [
      "Uma noite para exaltar o nome de Jesus com tudo o que somos. Venha adorar! 🎶",
      "Quando o povo de Deus adora, o céu se alegra. Venha cantar com a gente!",
    ],
    verse: "“Tudo quanto tem fôlego louve ao Senhor.” — Salmos 150:6",
  },
  campanha: {
    texts: [
      "Um tempo de fé, propósito e milagres. Venha participar e traga os seus pedidos! 🙏",
      "Deus continua fazendo o impossível. Venha viver essa campanha com a gente!",
    ],
    verse: "“Para Deus nada é impossível.” — Lucas 1:37",
  },
  retiro: {
    texts: [
      "Dias separados para descansar, ouvir a voz de Deus e fortalecer a comunhão. Garanta a sua vaga! ⛺",
      "Saia da rotina e entre num tempo especial com Deus e com os irmãos. Vamos juntos?",
    ],
    verse: "“Vinde vós, à parte, para um lugar deserto, e repousai um pouco.” — Marcos 6:31",
  },
  conferencia: {
    texts: [
      "Dias de palavra, adoração e avivamento. Prepare o coração para o que Deus vai fazer! 🔥",
      "Um encontro para marcar a sua caminhada. Convide alguém e venha!",
    ],
    verse: "“Aviva, ó Senhor, a tua obra.” — Habacuque 3:2",
  },
  evangelismo: {
    texts: [
      "O amor de Jesus não cabe só dentro da igreja. Vamos juntos levar essa boa notícia! ❤️",
      "Cada pessoa alcançada é uma vida transformada. Participe com a gente!",
    ],
    verse: "“Ide por todo o mundo e pregai o evangelho.” — Marcos 16:15",
  },
  lavacar: {
    texts: [
      "Seu carro limpinho e você ainda ajuda a obra de Deus! 🚗💦 Chame os amigos e apoie.",
      "Cada lavagem é uma semente plantada. Venha apoiar e traga o seu carro!",
    ],
    verse: "“Deus ama ao que dá com alegria.” — 2 Coríntios 9:7",
  },
  geral: {
    texts: [
      "Preparamos este momento com muito carinho, pensando em você. Venha fazer parte! ❤️",
      "Tem lugar para você e para a sua família. Chame alguém e venha também!",
      "Cada encontro é uma oportunidade de viver algo novo com Deus. Não fique de fora! 🙌",
    ],
    verse: "“Oh! quão bom e quão suave é que os irmãos vivam em união!” — Salmos 133:1",
  },
};

// palavras do título que indicam o tema (vale mais que a categoria "geral")
const KEYWORDS: [RegExp, string][] = [
  [/batis/i, "batismo"],
  [/ceia/i, "ceia"],
  [/jove|juventude|teen|adolesc/i, "jovens"],
  [/fam[ií]lia|casa(l|is)/i, "familia"],
  [/mulher|senhoras|feminin/i, "mulheres"],
  [/homens|varões|varoes|masculin/i, "homens"],
  [/crian|infantil|kids|ebf/i, "criancas"],
  [/ora[cç][aã]o|clamor|vig[ií]lia|jejum/i, "oracao"],
  [/estudo|escola b[ií]blica|ebd|discipul/i, "estudo"],
  [/louvor|adora[cç][aã]o|musical|cantata/i, "louvor"],
  [/retiro|acampa/i, "retiro"],
  [/confer[eê]ncia|congresso|semin[aá]rio|aviva/i, "conferencia"],
  [/evangel|miss[aã]o|miss[oõ]es/i, "evangelismo"],
  [/lava ?car/i, "lavacar"],
  [/campanha/i, "campanha"],
  [/culto/i, "culto"],
];

export function captionTheme(title: string, category?: string | null) {
  // palavra do título primeiro: "Estudo para o batismo" fala de batismo mesmo na categoria "geral"
  for (const [re, theme] of KEYWORDS) if (re.test(title)) return theme;
  return category && THEMES[category] ? category : "geral";
}

/** Primeira frase (ou duas, se curtas) da descrição do evento, para usar como texto da legenda. */
function excerpt(description?: string | null) {
  const clean = (description ?? "").replace(/\s+/g, " ").trim();
  if (clean.length < 20) return null;
  const sentences = clean.match(/[^.!?]+[.!?]+/g) ?? [clean];
  let out = "";
  for (const s of sentences) {
    if ((out + s).length > 280) break;
    out += s;
  }
  return (out || clean.slice(0, 277) + "…").trim();
}

const VERSE_REFLECTIONS = [
  "Que esta palavra fale ao seu coração hoje. 🙏",
  "Guarde esta promessa no coração e compartilhe com alguém que precisa ouvir isso hoje. ❤️",
  "Deus continua fiel ao que prometeu. Descanse nisso hoje. 🙌",
];

const NOTICE_TEXTS = ["Fique por dentro e compartilhe com os irmãos! 📢", "Anote aí e avise quem ainda não viu! 😉", "Contamos com você! 🙏"];

const PROGRAM_TEXTS = [
  "Tem programação para toda a família. Escolha um dia (ou todos 😉) e venha com a gente!",
  "A casa está de portas abertas. Salve este post e chame alguém para vir junto! ❤️",
  "Uma semana inteira de oportunidades para estar na presença de Deus. Te esperamos!",
];

const BIRTHDAY_TEXTS = [
  "Que Deus abençoe cada um de vocês com saúde, paz e um novo ano cheio da graça d'Ele! 🎂🙏",
  "Celebramos a vida de vocês e agradecemos a Deus por fazerem parte da nossa família! 🎉",
  "Mais um ano para viver os planos de Deus! Deixe nos comentários o seu parabéns. 🥳",
];

interface CaptionOpts {
  eventId?: string | null;
  /** categoria e descrição do evento escolhido em "Preencher com um evento" */
  category?: string | null;
  description?: string | null;
  hashtags: string;
  closing: string;
}

/** As opções de legenda para a arte (a primeira é a sugerida). */
export function buildCaptions(spec: ArtSpec, opts: CaptionOpts): string[] {
  const finish = (lines: (string | false | null | undefined)[]) => {
    const body = lines.filter((l): l is string => typeof l === "string" && l.length > 0).join("\n\n");
    return `${body.trim()}${opts.hashtags ? `\n\n${opts.hashtags}` : ""}`;
  };
  const link = (path: string, label: string) => `👉 ${label}: ${SITE}${path}`;

  switch (spec.template) {
    case "evento": {
      const theme = THEMES[captionTheme(spec.title, opts.category)];
      const own = excerpt(opts.description);
      const texts = own ? [own, ...theme.texts] : theme.texts;
      const signup = /inscri/i.test(spec.highlight);
      const more = opts.eventId ? link(`/eventos/${opts.eventId}`, signup ? "Faça sua inscrição" : "Saiba mais") : signup ? "👉 Inscrições pelo site (link na bio)." : null;
      return texts.map((t, i) => finish([t, i % 2 === 0 && theme.verse, more, opts.closing]));
    }
    case "versiculo":
      return VERSE_REFLECTIONS.map((t) => finish([t, spec.reference && `📖 ${spec.reference}`]));
    case "aviso":
    case "capa":
      return NOTICE_TEXTS.map((t) => finish([t]));
    case "programacao":
      return PROGRAM_TEXTS.map((t) => finish([t, link("/eventos", "Programação completa"), opts.closing]));
    case "aniversariantes":
      return BIRTHDAY_TEXTS.map((t) => finish([t]));
  }
}

/** Legenda do carrossel: um gancho para ler até o fim, sem repetir os slides. */
export function carouselCaptions(title: string, opts: { hashtags: string }): string[] {
  const t = title.trim();
  const hooks = [
    t ? `${t} 👉 Arraste para o lado e salve para ler de novo depois.` : "Arraste para o lado e salve para ler de novo depois. 👉",
    "Separe um minutinho e leia até o final. Pode ser exatamente o que você precisava hoje! 🙏",
    "Conhece alguém que precisa ler isso? Envie este post para essa pessoa. ❤️",
  ];
  return hooks.map((h) => `${h}${opts.hashtags ? `\n\n${opts.hashtags}` : ""}`);
}
