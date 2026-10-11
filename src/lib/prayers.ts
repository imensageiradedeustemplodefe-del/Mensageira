// Mirrors the original `sanitize_prayer_request_for_public`: first name + last initial.
export function sanitizeName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Anônimo";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// Categorias do pedido de oração (valor salvo -> nome mostrado), na ordem em que aparecem no formulário.
export const PRAYER_CATEGORY_LABELS = {
  geral: "Geral",
  saude: "Saúde",
  emocional: "Emocional (ansiedade, tristeza)",
  familia: "Família",
  casamento: "Casamento",
  filhos: "Filhos",
  relacionamentos: "Relacionamentos",
  trabalho: "Trabalho / Emprego",
  financeiro: "Financeiro",
  estudos: "Estudos",
  espiritual: "Vida espiritual",
  salvacao: "Salvação de alguém",
  libertacao: "Libertação / Vícios",
  luto: "Luto / Consolo",
  gratidao: "Agradecimento",
  outros: "Outros",
} as const;

export type PrayerCategory = keyof typeof PRAYER_CATEGORY_LABELS;
export const PRAYER_CATEGORIES = Object.keys(PRAYER_CATEGORY_LABELS) as [PrayerCategory, ...PrayerCategory[]];

export const prayerCategoryLabel = (category?: string | null) =>
  PRAYER_CATEGORY_LABELS[(category ?? "geral") as PrayerCategory] ?? "Geral";
