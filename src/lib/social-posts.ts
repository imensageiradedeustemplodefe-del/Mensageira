import { z } from "zod";

// Calendário de posts: tipos, situações e o formato aceito pela API.

export const POST_KINDS = { feed: "Feed", story: "Story", reels: "Reels", carrossel: "Carrossel", video: "Vídeo" } as const;
export const POST_STATUS = { planejado: "Planejado", producao: "Em produção", pronto: "Pronto", postado: "Postado" } as const;
export type PostKind = keyof typeof POST_KINDS;
export type PostStatus = keyof typeof POST_STATUS;

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data inválida");
export const socialPostSchema = z.object({
  date: day,
  title: z.string().trim().min(2).max(120),
  kind: z.enum(Object.keys(POST_KINDS) as [PostKind, ...PostKind[]]).default("feed"),
  status: z.enum(Object.keys(POST_STATUS) as [PostStatus, ...PostStatus[]]).default("planejado"),
  responsible: z.string().trim().max(60).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const toDbDate = (d: string) => new Date(`${d}T00:00:00Z`);
export const postSelect = { id: true, date: true, title: true, kind: true, status: true, responsible: true, notes: true } as const;
