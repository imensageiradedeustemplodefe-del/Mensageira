import type { Metadata } from "next";
import { AboutPage } from "@/components/pages/AboutPage";

export const metadata: Metadata = { title: "Sobre a Igreja", description: "Conheça a história, os valores e a liderança da Igreja Mensageira de Deus Templo de Fé." };

export default function Page() {
  return <AboutPage />;
}
