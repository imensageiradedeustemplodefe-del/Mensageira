"use client";

import { useState } from "react";
import { Check, Copy, RotateCcw, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Legenda pronta para o post: muda junto com a arte até alguém editar; "Refazer" volta à automática
 * e "Outra sugestão" alterna entre as opções de texto. */
export function CaptionBox({ options }: { options: string[] }) {
  // null = segue a legenda automática; texto = a pessoa editou
  const [custom, setCustom] = useState<string | null>(null);
  const [pick, setPick] = useState(0);
  const [copied, setCopied] = useState(false);
  const auto = options[pick % options.length] ?? "";
  const text = custom ?? auto;
  const edited = custom !== null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sem permissão: a pessoa copia do campo */
    }
  };

  return (
    <div className="space-y-1.5 rounded-lg border p-3 bg-card">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="art-caption">Legenda pronta</Label>
        <div className="flex flex-wrap justify-end gap-1">
          {edited && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1 h-8"
              onClick={() => setCustom(null)}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refazer
            </Button>
          )}
          {options.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 h-8"
              onClick={() => {
                setCustom(null);
                setPick((i) => (i + 1) % options.length);
              }}
            >
              <Shuffle className="w-3.5 h-3.5" /> Outra sugestão
            </Button>
          )}
          <Button type="button" size="sm" className="gap-1 h-8" onClick={copy}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiada" : "Copiar"}
          </Button>
        </div>
      </div>
      <Textarea
        id="art-caption"
        rows={7}
        value={text}
        onChange={(e) => setCustom(e.target.value)}
        className="text-sm"
      />
      <p className="text-[11px] text-muted-foreground">Hashtags e frase final: Configurações → Conteúdo do site → Redes sociais.</p>
    </div>
  );
}
