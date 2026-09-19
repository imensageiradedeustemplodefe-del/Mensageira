import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

// Sitemap dinâmico: páginas públicas + eventos publicados que exigem inscrição (têm página própria)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/sobre`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/eventos`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/live`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/galeria`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/testemunhos`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/oracoes`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contato`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  let eventPages: MetadataRoute.Sitemap = [];
  try {
    const events = await prisma.event.findMany({
      where: { isPublished: true, registrationRequired: true, eventDate: { gte: now } },
      select: { id: true, updatedAt: true },
    });
    eventPages = events.map((e) => ({
      url: `${SITE_URL}/eventos/${e.id}/inscricao`,
      lastModified: e.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  } catch {
    // banco indisponível: entrega só as páginas fixas
  }

  return [...staticPages, ...eventPages];
}
