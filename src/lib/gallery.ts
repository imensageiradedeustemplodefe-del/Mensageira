import { prisma } from "@/lib/prisma";
import { snake } from "@/lib/case";
import type { GalleryAlbum } from "@/types/database";

/** Álbuns publicados para renderizar a galeria no servidor (undefined se o banco falhar: a página busca no cliente). */
export async function loadPublishedAlbums(): Promise<GalleryAlbum[] | undefined> {
  try {
    const albums = await prisma.galleryAlbum.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      include: { photos: { select: { id: true, title: true, imageUrl: true, isPublished: true } } },
    });
    return snake<GalleryAlbum[]>(albums);
  } catch (err) {
    console.error("[galeria] falha ao carregar álbuns no servidor:", err);
    return undefined;
  }
}
