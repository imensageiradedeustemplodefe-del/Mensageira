import { prisma } from "@/lib/prisma";
import { snake } from "@/lib/case";
import { publicCache } from "@/lib/public-cache";
import type { GalleryAlbum } from "@/types/database";

/** Álbuns publicados (5 min em cache; a sincronização do Drive pelo painel limpa o cache). */
export const getPublishedAlbums = publicCache("albums", 300, async () =>
  snake<GalleryAlbum[]>(
    await prisma.galleryAlbum.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      include: { photos: { select: { id: true, title: true, imageUrl: true, isPublished: true } } },
    })
  )
);

/** Álbuns publicados para renderizar a galeria no servidor (undefined se o banco falhar: a página busca no cliente). */
export async function loadPublishedAlbums(): Promise<GalleryAlbum[] | undefined> {
  try {
    return await getPublishedAlbums();
  } catch (err) {
    console.error("[galeria] falha ao carregar álbuns no servidor:", err);
    return undefined;
  }
}
