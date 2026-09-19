import { prisma } from "@/lib/prisma";
import { handler, json } from "@/lib/api";
import { snake } from "@/lib/case";

export const GET = handler(async () => {
  const albums = await prisma.galleryAlbum.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: { photos: { select: { id: true, title: true, imageUrl: true, isPublished: true } } },
  });
  return json(snake(albums));
});
