"use client";

import { useEffect } from "react";

/** Abre a janela de impressão (onde dá para "Salvar como PDF") assim que a página carrega. */
export function AutoPrint() {
  useEffect(() => {
    let alive = true;
    // espera fontes e imagens (arte do certificado, fotos) para não imprimir a página pela metade
    const images = Array.from(document.images).map((img) =>
      img.complete
        ? null
        : new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          }),
    );
    Promise.all([document.fonts?.ready, ...images])
      .then(() => new Promise((resolve) => setTimeout(resolve, 300)))
      .then(() => alive && window.print());
    return () => {
      alive = false;
    };
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
