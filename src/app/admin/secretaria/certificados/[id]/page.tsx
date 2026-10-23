import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { certificateTemplate, type CertificateData } from "@/lib/certificates";
import { CertificateSheet } from "@/components/secretaria/CertificateSheet";
import { AutoPrint } from "@/components/print/AutoPrint";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Certificado", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f-]{36}$/i;

// Certificado em A4 deitado, pronto para imprimir ou salvar em PDF pelo navegador.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getStaffSession(["secretaria"]))) redirect("/admin");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const cert = await prisma.certificate.findUnique({ where: { id } });
  const template = cert && certificateTemplate(cert.type);
  if (!cert || !template) notFound();

  return (
    <div className="certificate-print">
      <AutoPrint />
      <CertificateSheet type={template.id} data={cert.data as CertificateData} />
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        html, body { background: #e5e7eb; }
        .certificate-print { padding: 24px; display: flex; justify-content: center; }
        .certificate-print .certificate-sheet { box-shadow: 0 4px 24px rgba(0,0,0,.18); }
        @media print {
          html, body { background: #fff; margin: 0; }
          .no-print { display: none !important; }
          .certificate-print { padding: 0; display: block; }
          .certificate-print .certificate-sheet { box-shadow: none; width: 297mm !important; height: 210mm !important; }
        }
      `}</style>
    </div>
  );
}
