import type { Metadata } from "next";
import { PrayerPage } from "@/components/pages/PrayerPage";

export const metadata: Metadata = { title: "Pedidos de Oração", description: "Envie seu pedido de oração. Nossa equipe estará intercedendo por você." };

export default function Page() {
  return <PrayerPage />;
}
