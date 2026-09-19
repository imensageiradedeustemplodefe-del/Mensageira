import type { Metadata } from "next";
import { EventsPage } from "@/components/pages/EventsPage";

export const metadata: Metadata = { title: "Eventos", description: "Programação de cultos e eventos da Igreja Mensageira de Deus Templo de Fé." };

export default function Page() {
  return <EventsPage />;
}
