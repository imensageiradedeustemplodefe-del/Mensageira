import type { Metadata } from "next";
import { ContactPage } from "@/components/pages/ContactPage";

export const metadata: Metadata = { title: "Contato", description: "Endereço, horários dos cultos e contato da Igreja Mensageira de Deus Templo de Fé em Caçador - SC (R. Elias Biasi, 49 - Berger)." };

export default function Page() {
  return <ContactPage />;
}
