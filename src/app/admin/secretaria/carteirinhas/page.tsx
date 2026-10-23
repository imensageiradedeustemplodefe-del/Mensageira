import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { CHURCH_NAME, shortDate } from "@/lib/certificates";
import { AutoPrint } from "@/components/print/AutoPrint";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Carteirinhas de membro", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f-]{36}$/i;
const PASTOR = "Gilmar José Radaelli";

const day = (d: Date | null) => (d ? shortDate(d.toISOString()) : "—");

// Carteirinhas no tamanho de cartão (85,6 x 54 mm), frente e verso lado a lado, 5 por folha A4.
// Uso: /admin/secretaria/carteirinhas?ids=uuid1,uuid2
export default async function Page({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  if (!(await getStaffSession(["secretaria"]))) redirect("/admin");
  const ids = ((await searchParams).ids ?? "").split(",").filter((id) => UUID.test(id)).slice(0, 200);
  const members = ids.length ? await prisma.member.findMany({ where: { id: { in: ids } }, orderBy: { name: "asc" } }) : [];

  return (
    <div className="cards-print">
      <AutoPrint />
      {members.length === 0 && <p style={{ padding: 24 }}>Nenhum membro selecionado.</p>}
      {members.map((m) => (
        <div className="pair" key={m.id}>
          <div className="card front">
            <div className="top">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo-icon.png" alt="" className="logo" />
              <div>
                <div className="church">{CHURCH_NAME}</div>
                <div className="kind">Carteira de Membro</div>
              </div>
            </div>
            <div className="body">
              <div className="photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.photo ? <img src={m.photo} alt="" /> : <span>FOTO 3x4</span>}
              </div>
              <div className="info">
                <div className="label">Nome</div>
                <div className="name">{m.name}</div>
                <div className="label">Cargo</div>
                <div className="value">{m.role}</div>
                <div className="row">
                  <div>
                    <div className="label">Matrícula</div>
                    <div className="value">{String(m.number).padStart(4, "0")}</div>
                  </div>
                  <div>
                    <div className="label">Membro desde</div>
                    <div className="value">{day(m.memberSince)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card back">
            <div className="grid">
              <div>
                <div className="label">Nascimento</div>
                <div className="value">{day(m.birthDate)}</div>
              </div>
              <div>
                <div className="label">Batismo</div>
                <div className="value">{day(m.baptismDate)}</div>
              </div>
              <div className="wide">
                <div className="label">Cidade</div>
                <div className="value">{[m.cidade, m.uf].filter(Boolean).join("/") || "—"}</div>
              </div>
            </div>
            <div className="sign">
              <div className="line" />
              <div className="value">{PASTOR}</div>
              <div className="label">Pastor Presidente</div>
            </div>
            <div className="foot">Documento pessoal e intransferível. Válido mediante apresentação junto à igreja.</div>
          </div>
        </div>
      ))}
      <style>{`
        @page { size: A4 portrait; margin: 6mm; }
        html, body { background: #fff; }
        .cards-print { font-family: Roboto, Arial, sans-serif; color: #0f172a; padding: 16px; }
        .cards-print .pair { display: flex; gap: 6mm; margin-bottom: 2.5mm; break-inside: avoid; justify-content: center; }
        .cards-print .card { width: 85.6mm; height: 54mm; border-radius: 3mm; overflow: hidden; position: relative; box-sizing: border-box;
          border: 0.2mm solid #cbd5e1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .cards-print .front { background: linear-gradient(160deg, #fff 55%, #e0efff); }
        .cards-print .top { display: flex; align-items: center; gap: 2mm; background: #1E90FF; color: #fff; padding: 1.8mm 3mm; }
        .cards-print .logo { width: 9mm; height: 9mm; border-radius: 50%; background: #fff; object-fit: contain; }
        .cards-print .church { font-size: 7.4pt; font-weight: 700; line-height: 1.1; }
        .cards-print .kind { font-size: 6pt; text-transform: uppercase; letter-spacing: .08em; opacity: .9; }
        .cards-print .body { display: flex; gap: 3mm; padding: 2.5mm 3mm; }
        .cards-print .photo { width: 20mm; height: 26mm; border: 0.3mm solid #94a3b8; border-radius: 1mm; overflow: hidden; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 5.5pt; color: #94a3b8; background: #f8fafc; }
        .cards-print .photo img { width: 100%; height: 100%; object-fit: cover; }
        .cards-print .info { min-width: 0; flex: 1; }
        .cards-print .label { font-size: 5.2pt; text-transform: uppercase; color: #64748b; letter-spacing: .05em; margin-top: 1mm; }
        .cards-print .name { font-size: 9pt; font-weight: 700; line-height: 1.15; }
        .cards-print .value { font-size: 7.5pt; font-weight: 600; }
        .cards-print .row { display: flex; gap: 4mm; }
        .cards-print .back { padding: 3mm 4mm; background: linear-gradient(160deg, #fff 60%, #e0efff); }
        .cards-print .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 4mm; }
        .cards-print .grid .wide { grid-column: span 2; }
        .cards-print .sign { position: absolute; left: 12mm; right: 12mm; bottom: 9mm; text-align: center; }
        .cards-print .sign .line { border-top: 0.25mm solid #334155; margin-bottom: 0.8mm; }
        .cards-print .sign .label { margin-top: 0; }
        .cards-print .foot { position: absolute; left: 0; right: 0; bottom: 0; background: #1E90FF; color: #fff; font-size: 5.2pt;
          text-align: center; padding: 1.2mm 2mm; }
        @media print { .no-print { display: none !important; } .cards-print { padding: 0; } }
      `}</style>
    </div>
  );
}
