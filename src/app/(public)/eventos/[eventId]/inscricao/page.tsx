import type { Metadata } from "next";
import { EventRegistrationPage } from "@/components/pages/EventRegistrationPage";

export const metadata: Metadata = { title: "Inscrição no Evento" };

export default async function Page({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <EventRegistrationPage eventId={eventId} />;
}
