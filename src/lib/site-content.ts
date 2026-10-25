// Conteúdo do site editável pelo painel (Configurações → Conteúdo do site).
// Cada campo tem como padrão o texto que já aparecia no site: enquanto ninguém editar, nada muda.
// O valor editado fica na tabela de configurações (site_settings) com a mesma chave; em branco = volta ao padrão.

export type ContentFieldType = "text" | "textarea";

export interface ContentField {
  key: string;
  label: string;
  type: ContentFieldType;
  default: string;
  help?: string;
}

export interface ContentSection {
  id: string;
  title: string;
  description?: string;
  fields: ContentField[];
}

const t = (key: string, label: string, def: string, help?: string): ContentField => ({ key, label, type: "text", default: def, help });
const ta = (key: string, label: string, def: string, help?: string): ContentField => ({ key, label, type: "textarea", default: def, help });

export const CONTENT_SECTIONS: ContentSection[] = [
  {
    id: "home",
    title: "Página inicial",
    fields: [
      t("home_hero_welcome", "Saudação", "Bem-vindos à"),
      t("home_hero_name", "Nome em destaque", "Mensageira de Deus"),
      t("home_hero_subtitle", "Subtítulo", "Templo de Fé"),
      t("home_hero_tagline", "Frase abaixo do subtítulo", "Uma igreja comprometida com a Palavra de Deus"),
      ta(
        "home_hero_text",
        "Texto de boas-vindas",
        "Venha fazer parte da nossa família de fé. Aqui você encontrará acolhimento, crescimento espiritual e uma comunidade que se importa com você.",
      ),
      t("home_events_title", "Título dos próximos eventos", "Próximos Eventos"),
      t("home_events_description", "Texto dos próximos eventos", "Participe dos nossos cultos e atividades. Todos são bem-vindos!"),
      t("home_visit_title", "Título do convite para visitar", "Venha nos Visitar"),
      ta(
        "home_visit_description",
        "Texto do convite para visitar",
        "Estamos de portas abertas para recebê-lo em nossa casa. Venha conhecer nossa comunidade e participar dos nossos cultos.",
      ),
    ],
  },
  {
    id: "about",
    title: "Sobre",
    description: "Os valores, os pastores e os ministérios ficam nas abas próprias.",
    fields: [
      t("about_title", "Título da página", "Nossa História"),
      ta(
        "church_description",
        "Texto sobre a igreja",
        "A Mensageira de Deus Templo de Fé é uma comunidade de fé comprometida com a pregação da Palavra de Deus e o cuidado pastoral das famílias.",
      ),
      t("about_values_title", "Título dos valores", "Nossos Valores"),
      t("about_pastors_title", "Título da liderança", "Liderança Pastoral"),
      t("about_pastors_description", "Texto da liderança", "Conheça nossa equipe pastoral dedicada ao serviço do Reino de Deus."),
      t("about_ministries_title", "Título dos ministérios", "Ministérios"),
      t("about_ministries_description", "Texto dos ministérios", "Conheça os diferentes ministérios que servem nossa comunidade."),
    ],
  },
  {
    id: "events",
    title: "Eventos",
    fields: [
      t("events_page_title", "Título da página", "Eventos e Programação"),
      t("events_page_subtitle", "Subtítulo", "Acompanhe nossa programação de eventos especiais e atividades"),
    ],
  },
  {
    id: "live",
    title: "Ao vivo",
    fields: [
      t("live_page_title", "Título da página", "Transmissão ao Vivo"),
      t("live_page_subtitle", "Subtítulo", "Participe dos nossos cultos online e faça parte da nossa comunidade de fé."),
    ],
  },
  {
    id: "prayer",
    title: "Oração",
    fields: [
      t("prayer_page_title", "Título da página", "Casa de Oração"),
      t("prayer_page_subtitle", "Subtítulo", '"A minha casa será chamada casa de oração para todos os povos" - Isaías 56:7'),
    ],
  },
  {
    id: "gallery",
    title: "Galeria",
    fields: [
      t("gallery_page_title", "Título da página", "Galeria de Fotos"),
      t("gallery_page_subtitle", "Subtítulo", "Momentos especiais da nossa comunidade"),
    ],
  },
  {
    id: "testimonies",
    title: "Testemunhos",
    fields: [
      t("testimonies_page_title", "Título da página", "Testemunhos"),
      t(
        "testimonies_page_subtitle",
        "Subtítulo",
        "Veja como Deus tem transformado vidas em nossa comunidade e compartilhe seu próprio testemunho.",
      ),
      t("testimonies_form_title", "Título do formulário", "Compartilhe seu Testemunho"),
      t("testimonies_form_description", "Texto do formulário", "Conte-nos como Deus tem agido em sua vida. Seu testemunho pode encorajar outros!"),
      t("testimonies_featured_title", "Título dos destaques", "Testemunhos em Destaque"),
      t("testimonies_all_title", "Título da lista", "Todos os Testemunhos"),
      t("testimonies_empty_message", "Mensagem sem testemunhos", "Nenhum testemunho publicado ainda. Seja o primeiro a compartilhar!"),
    ],
  },
  {
    id: "contact",
    title: "Contato",
    description: "Endereço, telefone e e-mails ficam em Sistema → Contato.",
    fields: [
      t("contact_page_title", "Título da página", "Entre em Contato"),
      ta(
        "contact_page_subtitle",
        "Subtítulo",
        "Estamos aqui para você. Entre em contato conosco para dúvidas, pedidos de oração ou para conhecer melhor nossa igreja.",
      ),
      ta(
        "contact_prayer_text",
        "Texto sobre pedidos de oração",
        "Envie seus pedidos de oração através do formulário ou durante nossas transmissões ao vivo. Nossa equipe estará orando por você.",
      ),
    ],
  },
  {
    id: "footer",
    title: "Rodapé",
    fields: [t("footer_text", "Texto do rodapé", "Mensageira de Deus Templo de Fé", "Aparece depois do © e do ano.")],
  },
];

export const CONTENT_DEFAULTS: Record<string, string> = Object.fromEntries(
  CONTENT_SECTIONS.flatMap((s) => s.fields.map((f) => [f.key, f.default])),
);

/** Listas da página Sobre (guardadas como JSON nas configurações). */
export const LIST_KEYS = ["about_values", "about_pastors", "about_ministries"] as const;
export type ListKey = (typeof LIST_KEYS)[number];

/** Todas as chaves de conteúdo: o painel pode criar estas configurações; a aba Sistema não mostra elas. */
export const CONTENT_KEYS = new Set<string>([...Object.keys(CONTENT_DEFAULTS), ...LIST_KEYS]);

/** Nome amigável de uma chave de conteúdo (para criar a linha nas configurações). */
export function contentLabel(key: string) {
  for (const s of CONTENT_SECTIONS) for (const f of s.fields) if (f.key === key) return `${s.title}: ${f.label}`;
  return { about_values: "Sobre: valores", about_pastors: "Sobre: pastores", about_ministries: "Sobre: ministérios" }[key] ?? key;
}
