// Dados das páginas de compartilhamento (evento, versículo, foto, testemunho), usados tanto pela
// página quanto pela imagem de preview. `cache` evita consultar o banco duas vezes na mesma requisição.
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id: string) => UUID.test(id);

export const getSharedEvent = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  return prisma.event.findFirst({ where: { id, isPublished: true } });
});

export const getSharedVerse = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  return prisma.dailyVerse.findFirst({ where: { id, isActive: true } });
});

export const getSharedTestimony = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  return prisma.testimony.findFirst({ where: { id, isApproved: true } });
});

export const getSharedAlbum = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  return prisma.galleryAlbum.findFirst({ where: { id, isPublished: true } });
});

/** Id de arquivo do Google Drive (evita montar URLs com qualquer texto vindo da URL). */
export const isDriveId = (id: string) => /^[A-Za-z0-9_-]{10,100}$/.test(id);

/** Id do arquivo no Drive a partir da URL da capa do álbum (".../thumbnail?id=XXX" ou ".../d/XXX"). */
export function driveIdFromUrl(url?: string | null) {
  const id = url?.match(/[?&]id=([^&]+)/)?.[1] ?? url?.match(/\/d\/([^=/?]+)/)?.[1] ?? null;
  return id && isDriveId(id) ? id : null;
}

export const fmtEventDate = (d: Date) =>
  d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
