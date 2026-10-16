import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isOrganizerToken } from "@/lib/organizer-link";
import { RegistrationsPrintSheet } from "@/components/print/RegistrationsPrintSheet";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lista de inscritos", robots: { index: false, follow: false }, referrer: "no-referrer" };

// PDF do link das organizadoras: a mesma lista do botão "PDF / Imprimir" do painel.
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isOrganizerToken(token)) notFound();

  const event = await prisma.event.findUnique({
    where: { organizerToken: token },
    include: {
      registrationFields: { orderBy: { fieldOrder: "asc" } },
      registrations: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!event) notFound();

  return <RegistrationsPrintSheet event={event} fields={event.registrationFields} regs={event.registrations} />;
}
