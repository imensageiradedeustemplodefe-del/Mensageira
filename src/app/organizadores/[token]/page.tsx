import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isOrganizerToken, paymentStatus } from "@/lib/organizer-link";
import { formatPhoneBR, isPhoneFieldType } from "@/lib/phone";
import { formatBRL, registrationCode } from "@/lib/pix";
import { OrganizerList, type OrganizerRow } from "@/components/organizers/OrganizerList";

// Sempre na hora (sem cache): é a situação atual das inscrições
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Inscrições — organização",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const show = (v: unknown) =>
  v === null || v === undefined || v === "" ? "" : Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Sim" : "Não") : String(v);

// Link das organizadoras (gerado no painel, em Inscrições): lista de inscritos e pagamentos, só leitura.
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

  // Colunas: campos do formulário + campos antigos que só existem nas respostas
  const columns = event.registrationFields.map((f) => ({ key: f.fieldName, label: f.fieldLabel, phone: isPhoneFieldType(f.fieldType) }));
  const known = new Set(columns.map((c) => c.key));
  for (const r of event.registrations) {
    for (const k of Object.keys((r.registrationData as Record<string, unknown>) ?? {})) {
      if (known.has(k)) continue;
      known.add(k);
      columns.push({ key: k, label: k.replace(/_/g, " "), phone: false });
    }
  }
  const nameCol = columns.find((c) => !c.phone);

  const tz = { timeZone: "America/Sao_Paulo" } as const;
  const when = event.eventDate.toLocaleString("pt-BR", { ...tz, weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
  const rows: OrganizerRow[] = event.registrations.map((r, i) => {
    const data = (r.registrationData as Record<string, unknown>) ?? {};
    return {
      id: r.id,
      n: i + 1,
      code: registrationCode(r.id),
      name: nameCol ? show(data[nameCol.key]) : "",
      details: columns
        .filter((c) => c !== nameCol)
        .map((c) => ({ label: c.label, value: c.phone && data[c.key] ? formatPhoneBR(data[c.key]) : show(data[c.key]), phone: c.phone }))
        .filter((d) => d.value),
      status: paymentStatus(r),
      method: r.paymentMethod,
      createdAt: r.createdAt.toLocaleString("pt-BR", { ...tz, dateStyle: "short", timeStyle: "short" }),
    };
  });

  return (
    <OrganizerList
      event={{
        title: event.title,
        when: when.charAt(0).toUpperCase() + when.slice(1),
        location: event.location,
        maxParticipants: event.maxParticipants,
        contributionCents: event.contributionCents,
        contribution: event.contributionCents ? `${formatBRL(event.contributionCents)}${event.contributionNote ? ` (${event.contributionNote})` : ""}` : null,
      }}
      rows={rows}
      updatedAt={new Date().toLocaleTimeString("pt-BR", { ...tz, hour: "2-digit", minute: "2-digit" })}
    />
  );
}
