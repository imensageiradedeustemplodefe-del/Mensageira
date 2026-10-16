import { prisma } from "@/lib/prisma";
import { handler, json } from "@/lib/api";
import { snake } from "@/lib/case";
import { publicCache } from "@/lib/public-cache";

const getMedia = publicCache("media", 600, async () => {
  const [items, categories] = await Promise.all([
    prisma.mediaItem.findMany({
      where: { isPublished: true },
      orderBy: [{ isRadio: "desc" }, { createdAt: "asc" }],
      include: { category: { select: { id: true, name: true, slug: true, icon: true } } },
    }),
    prisma.mediaCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  return snake({ items, categories });
});

export const GET = handler(async () => json(await getMedia()));
