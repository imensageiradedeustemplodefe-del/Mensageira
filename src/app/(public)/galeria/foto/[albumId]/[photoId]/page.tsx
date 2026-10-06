import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ShareButton";
import { getSharedAlbum, isDriveId, albumLabel } from "@/lib/share-pages";
import { sharePhoto } from "@/lib/share";

type Props = { params: Promise<{ albumId: string; photoId: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { albumId, photoId } = await params;
  const album = await getSharedAlbum(albumId);
  if (!album || !isDriveId(photoId)) return { title: "Foto não encontrada", robots: { index: false } };
  const { title, date } = albumLabel(album.name);
  const pageTitle = `Foto — ${title}${date ? ` (${date})` : ""}`;
  const description = `Foto do álbum “${title}”${date ? ` de ${date}` : ""} na galeria da Igreja Mensageira De Deus Templo De Fé.`;
  return {
    title: pageTitle,
    description,
    robots: { index: false, follow: true },
    openGraph: { title: pageTitle, description, type: "article", url: `/galeria/foto/${album.id}/${photoId}` },
    twitter: { title: pageTitle, description },
  };
}

export default async function Page({ params }: Props) {
  const { albumId, photoId } = await params;
  const album = await getSharedAlbum(albumId);
  if (!album || !isDriveId(photoId)) notFound();

  const { title, date } = albumLabel(album.name);
  const share = sharePhoto({ albumId: album.id, photoId, albumName: title, albumDate: date });

  return (
    <div className="min-h-screen bg-background">
      <section className="py-6 sm:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Galeria</p>
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground">{title}</h1>
            {date && <p className="text-muted-foreground mt-1">{date}</p>}
          </div>

          <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://drive.google.com/thumbnail?id=${photoId}&sz=w2000`}
              alt={`Foto do álbum ${title}`}
              className="max-h-[75vh] w-auto h-auto max-w-full object-contain"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
            <ShareButton data={share} />
            <a href={`https://drive.google.com/uc?id=${photoId}&export=download`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Baixar foto
              </Button>
            </a>
            <Link href={`/galeria?album=${album.id}`}>
              <Button className="w-full">
                <Images className="w-4 h-4 mr-2" />
                Ver o álbum completo
              </Button>
            </Link>
          </div>

          <div className="text-center mt-6">
            <Link href="/galeria">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Todos os álbuns
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
