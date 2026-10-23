"use client";

import { useLayoutEffect, useRef } from "react";
import { Cormorant_Garamond } from "next/font/google";
import { certificateTemplate, type CertificateData } from "@/lib/certificates";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "700"], display: "swap" });

// A página é desenhada em 1123x794 px (A4 deitado a 96 dpi) e escalada para caber na prévia.
export const SHEET_W = 1123;
export const SHEET_H = 794;
const MAX_FONT = 26;
const MIN_FONT = 14;

/**
 * Certificado pronto: arte de fundo + texto corrido que diminui a letra até caber na área do texto.
 * Recebe o tipo (e não o modelo) porque o modelo tem funções, que não passam do servidor para o navegador.
 */
export function CertificateSheet({ type, data, number }: { type: string; data: CertificateData; number?: string }) {
  const template = certificateTemplate(type)!;
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const runs = template.text(data);
  const key = JSON.stringify(runs);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;
    let size = MAX_FONT;
    text.style.fontSize = `${size}px`;
    while (size > MIN_FONT && text.scrollHeight > box.clientHeight) {
      size -= 0.5;
      text.style.fontSize = `${size}px`;
    }
  }, [key]);

  const b = template.body;
  return (
    <div
      className={`certificate-sheet ${serif.className}`}
      style={{ position: "relative", width: SHEET_W, height: SHEET_H, color: "#3b2a14", background: "#fff", overflow: "hidden" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={template.background} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div
        ref={boxRef}
        style={{
          position: "absolute",
          left: `${b.left}%`,
          top: `${b.top}%`,
          width: `${b.width}%`,
          height: `${b.height}%`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p ref={textRef} style={{ margin: 0, textAlign: "center", lineHeight: 1.55, fontWeight: 500, fontSize: MAX_FONT }}>
          {runs.map((r, i) =>
            r.strong ? (
              <strong key={i} style={{ fontWeight: 700, color: "#5a3d12" }}>
                {r.text}
              </strong>
            ) : (
              <span key={i}>{r.text}</span>
            ),
          )}
        </p>
      </div>
      {template.signatures(data).map((s, i) => (
        <div
          key={i}
          style={{ position: "absolute", left: `${s.left}%`, top: `${s.top + 1.4}%`, width: `${s.width}%`, textAlign: "center", lineHeight: 1.15 }}
        >
          <div style={{ fontSize: s.name.length > 32 ? 12.5 : 15, fontWeight: 700 }}>{s.name}</div>
          {s.role && <div style={{ fontSize: 13 }}>{s.role}</div>}
        </div>
      ))}
      {number && <div style={{ position: "absolute", right: "3%", bottom: "1.8%", fontSize: 12, color: "#e9dcb8" }}>Nº {number}</div>}
    </div>
  );
}
