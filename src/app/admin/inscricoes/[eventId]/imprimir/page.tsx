import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { AutoPrint } from "./AutoPrint";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lista de inscritos", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f-]{36}$/i;
const show = (v: unknown) =>
  v === null || v === undefined || v === "" ? "" : Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Sim" : "Não") : String(v);

// Lista de inscritos pronta para imprimir ou salvar em PDF (pelo próprio navegador).
export default async function Page({ params }: { params: Promise<{ eventId: string }> }) {
  if (!(await getAdminSession())) redirect("/admin/login");
  const { eventId } = await params;
  if (!UUID.test(eventId)) notFound();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();
  const fields = await prisma.eventRegistrationField.findMany({ where: { eventId }, orderBy: { fieldOrder: "asc" } });
  const regs = await prisma.eventRegistration.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } });

  const columns = fields.map((f) => ({ key: f.fieldName, label: f.fieldLabel }));
  const known = new Set(columns.map((c) => c.key));
  for (const r of regs) {
    for (const k of Object.keys((r.registrationData as Record<string, unknown>) ?? {})) {
      if (known.has(k)) continue;
      known.add(k);
      columns.push({ key: k, label: k.replace(/_/g, " ") });
    }
  }

  const tz = { timeZone: "America/Sao_Paulo" } as const;
  const when = event.eventDate.toLocaleString("pt-BR", { ...tz, weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const generated = new Date().toLocaleString("pt-BR", { ...tz, dateStyle: "short", timeStyle: "short" });

  return (
    <div className="print-sheet">
      <style>{`
        @page { size: A4 ${columns.length > 4 ? "landscape" : "portrait"}; margin: 14mm; }
        body { background: #fff !important; }
        .print-sheet { color: #111; background: #fff; font-family: Roboto, Arial, sans-serif; padding: 24px; max-width: 1100px; margin: 0 auto; }
        .print-sheet h1 { font-size: 20px; margin: 0; }
        .print-sheet .muted { color: #555; font-size: 12px; }
        .print-sheet table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11.5px; }
        .print-sheet th, .print-sheet td { border: 1px solid #bbb; padding: 6px 8px; text-align: left; vertical-align: top; }
        .print-sheet th { background: #e8f2ff; font-weight: 700; }
        .print-sheet tr:nth-child(even) td { background: #fafafa; }
        .print-sheet .head { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #1E90FF; padding-bottom: 12px; }
        .print-sheet .sign { margin-top: 40px; display: flex; gap: 60px; font-size: 12px; }
        .print-sheet .sign div { flex: 1; border-top: 1px solid #333; padding-top: 4px; text-align: center; }
        @media print { .no-print { display: none !important; } .print-sheet { padding: 0; } tr { break-inside: avoid; } }
      `}</style>
      <AutoPrint />

      <div className="head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-icon.png" alt="" width={56} height={56} />
        <div>
          <div className="muted">Igreja Mensageira De Deus Templo De Fé — Lista de inscritos</div>
          <h1>{event.title}</h1>
          <div className="muted" style={{ textTransform: "capitalize" }}>
            {when}
            {event.location ? ` • ${event.location}` : ""}
          </div>
        </div>
      </div>

      <p className="muted" style={{ marginTop: 10 }}>
        Total: <strong>{regs.length}</strong> inscrito(s)
        {event.maxParticipants ? ` de ${event.maxParticipants} vagas` : ""} • Gerado em {generated}
      </p>

      <table>
        <thead>
          <tr>
            <th style={{ width: 32 }}>Nº</th>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            <th style={{ width: 110 }}>Inscrito em</th>
          </tr>
        </thead>
        <tbody>
          {regs.map((r, i) => {
            const data = (r.registrationData as Record<string, unknown>) ?? {};
            return (
              <tr key={r.id}>
                <td>{i + 1}</td>
                {columns.map((c) => (
                  <td key={c.key}>{show(data[c.key])}</td>
                ))}
                <td>{r.createdAt.toLocaleString("pt-BR", { ...tz, dateStyle: "short", timeStyle: "short" })}</td>
              </tr>
            );
          })}
          {regs.length === 0 && (
            <tr>
              <td colSpan={columns.length + 2} style={{ textAlign: "center", padding: 20 }}>
                Nenhuma inscrição.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="sign">
        <div>Responsável</div>
        <div>Data</div>
      </div>
    </div>
  );
}
