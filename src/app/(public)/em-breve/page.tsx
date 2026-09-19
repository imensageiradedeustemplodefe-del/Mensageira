import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/pages/ComingSoonPage";

export const metadata: Metadata = { title: "Em Breve", robots: { index: false, follow: true } };

export default function Page() {
  return <ComingSoonPage />;
}
