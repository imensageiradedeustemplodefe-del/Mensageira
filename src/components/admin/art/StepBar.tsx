"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Barra de etapas do Criar arte e do Carrossel: mostra onde a pessoa está, deixa voltar a uma etapa já
 * feita (ou avançar quando `canGo` permitir) e guarda à direita os botões de voltar/continuar.
 */
export function StepBar<Id extends string>({
  steps,
  current,
  onGo,
  canGo,
  children,
}: {
  steps: readonly { id: Id; label: string }[];
  current: Id;
  onGo: (id: Id) => void;
  /** além das etapas já feitas, quais dá para abrir agora (ex.: a última, quando a arte está pronta) */
  canGo?: (id: Id) => boolean;
  children?: React.ReactNode;
}) {
  const idx = steps.findIndex((x) => x.id === current);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <ol className="flex items-center gap-1 sm:gap-2 text-sm" aria-label="Etapas">
        {steps.map((s, i) => {
          const done = i < idx;
          const can = i <= idx || !!canGo?.(s.id);
          return (
            <li key={s.id} className="flex items-center gap-1 sm:gap-2 min-w-0">
              {i > 0 && <span className={cn("h-px w-4 sm:w-10 shrink-0", done || s.id === current ? "bg-primary" : "bg-border")} />}
              <button
                type="button"
                disabled={!can}
                onClick={() => onGo(s.id)}
                aria-current={s.id === current ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-2 sm:px-3 py-1.5 min-h-0 min-w-0 transition-colors",
                  s.id === current ? "bg-primary text-primary-foreground" : done ? "text-primary hover:bg-primary/10" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    s.id === current ? "bg-primary-foreground/20" : done ? "bg-primary text-primary-foreground" : "border",
                  )}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span className={cn("truncate font-medium", s.id !== current && "hidden sm:inline")}>{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {children && <div className="flex flex-wrap gap-2 ml-auto">{children}</div>}
    </div>
  );
}
