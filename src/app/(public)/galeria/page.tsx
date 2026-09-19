import type { Metadata } from "next";
import { GalleryPage } from "@/components/pages/GalleryPage";

export const metadata: Metadata = { title: "Galeria", description: "Momentos especiais da nossa comunidade em fotos." };

export default function Page() {
  return <GalleryPage />;
}
