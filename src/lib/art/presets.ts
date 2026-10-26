import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Modelos de arte salvos: campos aceitos pela API e limpeza da miniatura antiga.

export const thumbUrlSchema = z.string().regex(/^\/api\/images\/[0-9a-f-]{36}$/i, "miniatura inválida");
export const presetSelect = { id: true, name: true, spec: true, thumbUrl: true } as const;

/** Apaga a imagem da miniatura (cada miniatura é só do seu modelo). */
export async function deleteThumb(url: string | null | undefined) {
  const id = url?.match(/^\/api\/images\/([0-9a-f-]{36})$/i)?.[1];
  if (id) await prisma.siteImage.deleteMany({ where: { id } });
}
