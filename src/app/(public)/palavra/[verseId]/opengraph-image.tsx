import { ogResponse, OgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getSharedVerse } from "@/lib/share-pages";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Palavra do Dia — Igreja Mensageira De Deus Templo De Fé";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ verseId: string }> }) {
  const { verseId } = await params;
  const verse = await getSharedVerse(verseId);
  return ogResponse((logo) => (
    <OgCard
      logo={logo}
      label="PALAVRA DO DIA"
      quote={!!verse}
      title={verse?.verseText ?? "Palavra do Dia"}
      lines={verse ? [verse.verseReference] : []}
    />
  ));
}
