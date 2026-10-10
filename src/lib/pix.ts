// Gera o "PIX copia e cola" (BR Code estático, padrão EMV do Banco Central) com valor fixo.
// O mesmo texto vira o QR Code. Não depende de banco/intermediário: o pagamento cai direto na chave.

const strip = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .\-]/g, "")
    .trim();

const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const isCpf = (d: string) => {
  if (!/^\d{11}$/.test(d) || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
};

/** Deixa a chave no formato que o PIX espera (CPF/CNPJ só números, telefone com +55, e-mail minúsculo). */
export function normalizePixKey(raw: string) {
  const k = raw.trim();
  if (k.includes("@")) return k.toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k)) return k.toLowerCase(); // aleatória
  const digits = k.replace(/\D/g, "");
  if (k.startsWith("+")) return `+${digits}`;
  if (digits.length === 14) return digits; // CNPJ
  if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(k)) return digits; // CPF formatado
  if (/[()\s]/.test(k) && (digits.length === 10 || digits.length === 11)) return `+55${digits}`; // telefone formatado
  if (digits.length === 11) return isCpf(digits) ? digits : `+55${digits}`;
  if (digits.length === 10) return `+55${digits}`;
  return k;
}

export interface PixParams {
  key: string;
  name: string;
  city: string;
  /** em centavos */
  amountCents?: number | null;
  /** identificador curto que aparece no extrato (até 25 letras/números) */
  txid?: string;
  /** mensagem para quem recebe (opcional) */
  description?: string;
}

export function pixPayload({ key, name, city, amountCents, txid, description }: PixParams) {
  const merchant =
    field("00", "br.gov.bcb.pix") +
    field("01", normalizePixKey(key)) +
    (description ? field("02", strip(description).slice(0, 40)) : "");
  const tx = (txid ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";

  const payload =
    field("00", "01") +
    field("26", merchant) +
    field("52", "0000") +
    field("53", "986") +
    (amountCents && amountCents > 0 ? field("54", (amountCents / 100).toFixed(2)) : "") +
    field("58", "BR") +
    field("59", strip(name).slice(0, 25) || "IGREJA") +
    field("60", strip(city).slice(0, 15) || "CACADOR") +
    field("62", field("05", tx)) +
    "6304";
  return payload + crc16(payload);
}

/** Código curto da inscrição (6 caracteres) que vai no PIX como identificador e aparece na lista do painel. */
export const registrationCode = (id: string) => id.replace(/-/g, "").slice(0, 6).toUpperCase();

export const formatBRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
