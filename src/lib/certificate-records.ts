import { z } from "zod";
import { HttpError } from "@/lib/api";
import { certificateTemplate } from "@/lib/certificates";

// Corpo enviado pelo formulário de certificado (criar e editar)
export const certificateBody = z.object({
  type: z.string().min(1).max(60),
  member_id: z.string().uuid().nullable().optional(),
  data: z.record(z.string(), z.string().trim().max(300)),
});

/** Confere o modelo e os campos obrigatórios; devolve só os campos que o modelo conhece. */
export function validateCertificate(type: string, raw: Record<string, string>) {
  const template = certificateTemplate(type);
  if (!template) throw new HttpError(400, "Modelo de certificado desconhecido");
  const data: Record<string, string> = {};
  for (const field of template.fields) {
    const value = (raw[field.key] ?? "").trim();
    if (field.required && !value) throw new HttpError(400, `Preencha: ${field.label}`);
    if (field.type === "date" && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new HttpError(400, `Data inválida: ${field.label}`);
    data[field.key] = value;
  }
  return { template, data, recipientName: data.nome || "—" };
}
