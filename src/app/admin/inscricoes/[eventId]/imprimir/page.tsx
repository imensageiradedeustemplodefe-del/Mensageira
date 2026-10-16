import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { RegistrationsPrintSheet } from "@/components/print/RegistrationsPrintSheet";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lista de inscritos", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f-]{36}$/i;

// Lista de inscritos pronta para imprimir ou salvar em PDF (pelo próprio navegador).
export default async function Page({ params }: { params: Promise<{ eventId: string }> }) {
  if (!(await getAdminSession())) redirect("/admin/login");
  const { eventId } = await params;
  if (!UUID.test(eventId)) notFound();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();
  const fields = await prisma.eventRegistrationField.findMany({ where: { eventId }, orderBy: { fieldOrder: "asc" } });
  const regs = await prisma.eventRegistration.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } });

  return <RegistrationsPrintSheet event={event} fields={fields} regs={regs} />;
}
