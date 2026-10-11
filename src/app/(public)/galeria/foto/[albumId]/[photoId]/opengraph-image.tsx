import { ogResponse, OgCard, OgPhoto, drivePhotoDataUrl, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getSharedAlbum, isDriveId } from "@/lib/share-pages";
import { albumLabel } from "@/lib/share";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Foto da galeria — Igreja Mensageira De Deus Templo De Fé";
export const revalidate = 86400;

type Params = { albumId: string; photoId: string };

export default async function Image({ params }: { params: Promise<Params> }) {
  const { albumId, photoId } = await params;
  const [album, photo] = await Promise.all([getSharedAlbum(albumId), isDriveId(photoId) ? drivePhotoDataUrl(photoId) : null]);
  const label = album ? albumLabel(album.name) : null;
  const caption = [label?.title, label?.date].filter(Boolean).join(" • ");

  if (!photo) {
    return ogResponse((logo) => <OgCard logo={logo} label="GALERIA" title={label?.title ?? "Galeria de fotos"} lines={label?.date ? [label.date] : []} />);
  }

  return ogResponse((logo) => <OgPhoto logo={logo} photo={photo} caption={caption} />);
}
