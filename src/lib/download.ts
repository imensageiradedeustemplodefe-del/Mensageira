// Baixa um arquivo do Google Drive (foto/vídeo da galeria) direto no site, sem abrir o Drive.
// O endereço de download do Drive libera CORS, então o navegador busca o arquivo original, monta
// um Blob e salva com o nome certo. Se o Drive pedir confirmação (arquivos muito grandes) ou algo
// falhar, abre o link do Drive como antes.

export const driveDownloadUrl = (id: string) => `https://drive.usercontent.google.com/download?id=${id}&export=download`;

export async function downloadDriveFile(id: string, filename: string, onProgress?: (pct: number | null) => void) {
  const url = driveDownloadUrl(id);
  try {
    const res = await fetch(url);
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || type.includes("text/html") || !res.body) throw new Error("fallback");

    const total = Number(res.headers.get("content-length")) || 0;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      onProgress?.(total ? Math.round((received / total) * 100) : null);
    }

    const blob = new Blob(chunks as BlobPart[], { type: type || "application/octet-stream" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 30_000);
    return "downloaded" as const;
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
    return "opened" as const;
  }
}
