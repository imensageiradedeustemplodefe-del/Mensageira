import type { Metadata } from "next";
import { ContactPage } from "@/components/pages/ContactPage";

export const metadata: Metadata = { title: "Contato", description: "Entre em contato com a Igreja Mensageira de Deus Templo de Fé." };

export default function Page() {
  return <ContactPage />;
}
