import { ogResponse, OgCard, OgPhoto, drivePhotoDataUrl, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getSharedAlbum, driveIdFromUrl } from "@/lib/share-pages";
import { albumLabel, albumPhotoTotal } from "@/lib/share";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Álbum da galeria — Igreja Mensageira De Deus Templo De Fé";
export const revalidate = 86400;

export default async function Image({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = await params;
  const album = await getSharedAlbum(albumId);
  const coverId = driveIdFromUrl(album?.coverPhotoUrl);
  const cover = coverId ? await drivePhotoDataUrl(coverId) : null;
  const label = album ? albumLabel(album.name) : null;
  const total = albumPhotoTotal(album?.photoCount);
  const details = [label?.date, total ? `${total} fotos` : null].filter((s): s is string => Boolean(s));

  if (!cover) {
    return ogResponse((logo) => <OgCard logo={logo} label="ÁLBUM DE FOTOS" title={label?.title ?? "Galeria de fotos"} lines={details} />);
  }

  return ogResponse((logo) => <OgPhoto logo={logo} photo={cover} caption={[label?.title, ...details].filter(Boolean).join(" • ")} />);
}
