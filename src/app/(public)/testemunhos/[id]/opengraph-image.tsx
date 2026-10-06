import { ogResponse, OgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getSharedTestimony } from "@/lib/share-pages";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Testemunho — Igreja Mensageira De Deus Templo De Fé";
export const revalidate = 600;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getSharedTestimony(id);
  return ogResponse((logo) => (
    <OgCard logo={logo} label="TESTEMUNHO" quote={!!t} title={t?.content ?? "Testemunhos de fé"} lines={t ? [`— ${t.name}`] : []} />
  ));
}
