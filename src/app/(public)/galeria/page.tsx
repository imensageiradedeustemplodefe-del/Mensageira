import type { Metadata } from "next";
import { GalleryPage } from "@/components/pages/GalleryPage";
import { loadPublishedAlbums } from "@/lib/gallery";

export const metadata: Metadata = { title: "Galeria", description: "Fotos e vídeos dos cultos, Santa Ceia e eventos da Igreja Mensageira de Deus Templo de Fé em Caçador - SC." };

// Álbuns renderizados no servidor para aparecerem imediatamente; revalidados a cada minuto.
export const revalidate = 60;

export default async function Page() {
  return <GalleryPage initialAlbums={await loadPublishedAlbums()} />;
}
