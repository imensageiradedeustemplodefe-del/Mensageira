// Mirrors the original `sanitize_prayer_request_for_public`: first name + last initial.
export function sanitizeName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Anônimo";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export const PRAYER_CATEGORIES = [
  "geral",
  "saude",
  "familia",
  "trabalho",
  "financeiro",
  "espiritual",
  "relacionamentos",
] as const;
