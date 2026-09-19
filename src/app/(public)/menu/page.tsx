import type { Metadata } from "next";
import { MobileMenuPage } from "@/components/pages/MobileMenuPage";

export const metadata: Metadata = { title: "Menu", robots: { index: false, follow: true } };

export default function Page() {
  return <MobileMenuPage />;
}
