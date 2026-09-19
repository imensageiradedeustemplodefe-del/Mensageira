import { prisma } from "@/lib/prisma";
import { handler, json } from "@/lib/api";
import { snake } from "@/lib/case";

export const GET = handler(async () => {
  const [items, categories] = await Promise.all([
    prisma.mediaItem.findMany({
      where: { isPublished: true },
      orderBy: [{ isRadio: "desc" }, { createdAt: "desc" }],
      include: { category: { select: { id: true, name: true, slug: true, icon: true } } },
    }),
    prisma.mediaCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  return json(snake({ items, categories }));
});
