"use client";

import { useEffect } from "react";

/** Abre a janela de impressão (onde dá para "Salvar como PDF") assim que a página carrega. */
export function AutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print fixed top-4 right-4 rounded-full bg-[#1E90FF] px-5 py-2 text-sm font-semibold text-white shadow-lg"
    >
      Imprimir / Salvar PDF
    </button>
  );
}
