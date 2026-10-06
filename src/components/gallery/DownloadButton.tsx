"use client";

import { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadDriveFile } from "@/lib/download";

interface Props {
  fileId: string;
  filename: string;
  label?: string;
  isVideo?: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

/** Baixa a foto/vídeo original direto no aparelho, mostrando o progresso. */
export function DownloadButton({ fileId, filename, label, isVideo = false, className = "", variant = "outline", size = "default" }: Props) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [pct, setPct] = useState<number | null>(null);
  const what = isVideo ? "vídeo" : "foto";

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state === "busy") return;
    setState("busy");
    setPct(null);
    const id = toast.loading(`Baixando ${what}…`);
    const result = await downloadDriveFile(fileId, filename, (p) => {
      setPct(p);
      if (p !== null) toast.loading(`Baixando ${what}… ${p}%`, { id });
    });
    if (result === "downloaded") {
      toast.success(`${what === "foto" ? "Foto salva" : "Vídeo salvo"} no seu aparelho!`, { id, description: filename });
      setState("done");
      setTimeout(() => setState("idle"), 2500);
    } else {
      toast.info(`Abrimos o ${what} no Google Drive para você baixar.`, { id });
      setState("idle");
    }
  };

  const icon =
    state === "busy" ? <Loader2 className="w-4 h-4 animate-spin" /> : state === "done" ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />;
  const text = label ?? (state === "busy" ? (pct !== null ? `Baixando ${pct}%` : "Baixando…") : state === "done" ? "Baixada!" : `Baixar ${what}`);

  return (
    <Button variant={variant} size={size} onClick={onClick} className={className} aria-label={`Baixar ${what}`} title={`Baixar ${what}`}>
      {icon}
      {size !== "icon" && <span className="ml-2">{text}</span>}
    </Button>
  );
}
