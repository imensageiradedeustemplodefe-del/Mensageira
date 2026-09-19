import type { Metadata } from "next";
import { LivePage } from "@/components/pages/LivePage";

export const metadata: Metadata = { title: "Ao Vivo", description: "Assista aos cultos ao vivo da Igreja Mensageira de Deus Templo de Fé." };

export default function Page() {
  return <LivePage />;
}
