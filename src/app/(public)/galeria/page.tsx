import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { snake } from "@/lib/case";
import { GalleryPage } from "@/components/pages/GalleryPage";
import type { GalleryAlbum } from "@/types/database";

export const metadata: Metadata = { title: "Galeria", description: "Momentos especiais da nossa comunidade em fotos." };

// Álbuns renderizados no servidor para aparecerem imediatamente; revalidados a cada minuto.
export const revalidate = 60;

export default async function Page() {
  let initialAlbums: GalleryAlbum[] | undefined;
  try {
    const albums = await prisma.galleryAlbum.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      include: { photos: { select: { id: true, title: true, imageUrl: true, isPublished: true } } },
    });
    initialAlbums = snake<GalleryAlbum[]>(albums);
  } catch (err) {
    console.error("[galeria] falha ao carregar álbuns no servidor:", err);
  }
  return <GalleryPage initialAlbums={initialAlbums} />;
}
