"use client";

import { useState } from "react";
import { Check, Copy, RotateCcw, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Estado da legenda pronta: segue a sugestão automática até alguém editar; "Outra sugestão" alterna
 * entre as opções. Quando `resetKey` muda (outro modelo, outro evento), volta à primeira sugestão.
 */
export function useCaption(options: string[], resetKey = "") {
  const [state, setState] = useState<{ key: string; custom: string | null; pick: number }>({ key: resetKey, custom: null, pick: 0 });
  const cur = state.key === resetKey ? state : { key: resetKey, custom: null, pick: 0 };
  const auto = options[cur.pick % Math.max(options.length, 1)] ?? "";
  return {
    text: cur.custom ?? auto,
    edited: cur.custom !== null,
    many: options.length > 1,
    edit: (text: string) => setState({ ...cur, custom: text }),
    next: () => setState({ ...cur, custom: null, pick: (cur.pick + 1) % Math.max(options.length, 1) }),
    reset: () => setState({ ...cur, custom: null }),
  };
}
export type CaptionState = ReturnType<typeof useCaption>;

/** Caixa da legenda pronta, com copiar, "Outra sugestão" e "Refazer". */
export function CaptionBox({ caption }: { caption: CaptionState }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(caption.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sem permissão: a pessoa copia do campo */
    }
  };

  return (
    <div className="space-y-1.5 rounded-lg border p-3 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="art-caption" className="whitespace-nowrap">Legenda pronta</Label>
        <div className="flex flex-wrap justify-end gap-1">
          {caption.edited && (
            <Button type="button" variant="ghost" size="sm" className="gap-1 h-8" onClick={caption.reset}>
              <RotateCcw className="w-3.5 h-3.5" /> Refazer
            </Button>
          )}
          {caption.many && (
            <Button type="button" variant="outline" size="sm" className="gap-1 h-8" onClick={caption.next}>
              <Shuffle className="w-3.5 h-3.5" /> Outra sugestão
            </Button>
          )}
          <Button type="button" size="sm" className="gap-1 h-8" onClick={copy}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiada" : "Copiar"}
          </Button>
        </div>
      </div>
      <Textarea id="art-caption" rows={7} value={caption.text} onChange={(e) => caption.edit(e.target.value)} className="text-sm" />
      <p className="text-[11px] text-muted-foreground">Hashtags e frase final: Configurações → Conteúdo do site → Redes sociais.</p>
    </div>
  );
}
