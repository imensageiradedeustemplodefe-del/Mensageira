// Link das organizadoras de um evento: página só de leitura com os inscritos e os pagamentos.

const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://imensageiradedeus.com.br").replace(/\/$/, "");

export const organizerUrl = (token: string) => `${ORIGIN}/organizadores/${token}`;

/** Formato do código gerado (randomBytes(24) em base64url). Evita consultar o banco com qualquer texto. */
export const isOrganizerToken = (token: string) => /^[A-Za-z0-9_-]{32}$/.test(token);

export type PaymentStatus = "paid" | "reported" | "cash" | "pending";

/** Situação do pagamento de uma inscrição (mesma regra da lista do painel). */
export function paymentStatus(r: { contributionPaid: boolean; paymentReportedAt: Date | string | null; paymentMethod: string | null }): PaymentStatus {
  if (r.contributionPaid) return "paid";
  if (r.paymentReportedAt) return "reported";
  if (r.paymentMethod === "cash") return "cash";
  return "pending";
}
