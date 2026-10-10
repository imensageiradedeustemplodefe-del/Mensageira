// Telefones brasileiros sempre no formato (49) 99199-0484 / (49) 3333-4444.

const digitsOf = (v: string) => v.replace(/\D/g, "");

/** Formata um telefone completo. Se não parecer um telefone brasileiro, devolve o texto como veio. */
export function formatPhoneBR(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  let d = digitsOf(raw);
  if (d.length >= 12 && d.startsWith("55")) d = d.slice(2); // +55
  if ((d.length === 11 || d.length === 12) && d.startsWith("0")) d = d.slice(1); // 0 antes do DDD (ex.: 049...)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

/** Máscara enquanto a pessoa digita: vai montando (49) 99199-0484. */
export function maskPhoneInput(value: string): string {
  const d = digitsOf(value).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const isPhoneFieldType = (t?: string | null) => t === "phone" || t === "tel";
