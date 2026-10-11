import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleryPage } from "@/components/pages/GalleryPage";
import { getSharedAlbum } from "@/lib/share-pages";
import { albumLabel, albumPhotoTotal } from "@/lib/share";
import { loadPublishedAlbums } from "@/lib/gallery";

type Props = { params: Promise<{ albumId: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { albumId } = await params;
  const album = await getSharedAlbum(albumId);
  if (!album) return { title: "Álbum não encontrado", robots: { index: false } };
  const { title, date } = albumLabel(album.name);
  const total = albumPhotoTotal(album.photoCount);
  const pageTitle = `Fotos — ${title}${date ? ` (${date})` : ""}`;
  const description = `${total ? `${total} fotos` : "Fotos"} do álbum “${title}”${date ? ` de ${date}` : ""} na galeria da Igreja Mensageira De Deus Templo De Fé.`;
  return {
    title: pageTitle,
    description,
    alternates: { canonical: `/galeria/album/${album.id}` },
    openGraph: { title: pageTitle, description, type: "article", url: `/galeria/album/${album.id}` },
    twitter: { title: pageTitle, description },
  };
}

// Link compartilhado de um álbum: abre a galeria já dentro do álbum
export default async function Page({ params }: Props) {
  const { albumId } = await params;
  const album = await getSharedAlbum(albumId);
  if (!album) notFound();
  return <GalleryPage initialAlbums={await loadPublishedAlbums()} initialAlbumId={album.id} />;
}
