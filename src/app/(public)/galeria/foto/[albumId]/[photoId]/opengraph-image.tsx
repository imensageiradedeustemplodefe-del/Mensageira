import { ogResponse, OgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getSharedAlbum, isDriveId, albumLabel } from "@/lib/share-pages";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Foto da galeria — Igreja Mensageira De Deus Templo De Fé";
export const revalidate = 86400;

type Params = { albumId: string; photoId: string };

async function photoDataUrl(photoId: string) {
  if (!isDriveId(photoId)) return null;
  try {
    const res = await fetch(`https://drive.google.com/thumbnail?id=${photoId}&sz=w1200`, { redirect: "follow" });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { albumId, photoId } = await params;
  const [album, photo] = await Promise.all([getSharedAlbum(albumId), photoDataUrl(photoId)]);
  const label = album ? albumLabel(album.name) : null;
  const caption = [label?.title, label?.date].filter(Boolean).join(" • ");

  if (!photo) {
    return ogResponse((logo) => <OgCard logo={logo} label="GALERIA" title={label?.title ?? "Galeria de fotos"} lines={label?.date ? [label.date] : []} />);
  }

  return ogResponse((logo) => (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0D57B5", fontFamily: "Roboto" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} width={1200} height={630} style={{ width: 1200, height: 630, objectFit: "cover", objectPosition: "50% 30%" }} alt="" />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "26px 36px",
          backgroundImage: "linear-gradient(to top, rgba(8,40,90,0.95), rgba(8,40,90,0.75) 60%, rgba(8,40,90,0))",
          color: "#fff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={64} height={64} style={{ borderRadius: 999, background: "#fff", border: "3px solid #fff" }} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700 }}>Igreja Mensageira De Deus Templo De Fé</div>
          {caption && <div style={{ display: "flex", fontSize: 24, color: "#FFD700" }}>{caption}</div>}
        </div>
      </div>
    </div>
  ));
}
