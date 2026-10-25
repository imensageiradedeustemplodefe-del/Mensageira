"use client";

import { useState } from "react";
import { CalendarClock, Lock, LockOpen, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";
import { fmtClose, isClosed, scheduledClose } from "@/lib/event-closure";

export interface Closures {
  registrations_closed: boolean;
  contributions_closed: boolean;
  registrations_close_at: string | null;
  contributions_close_at: string | null;
}

type Kind = "registrations" | "contributions";

/** "2026-10-25T18:00" (campo datetime-local, horário do aparelho) a partir de uma data ISO */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

/**
 * Chaves para encerrar (e reabrir) as inscrições e as contribuições de um evento, na hora ou programado
 * para uma data e hora. Inscrições encerradas: ninguém mais se inscreve. Contribuições encerradas: some o PIX.
 */
export function EventClosureControls({
  eventId,
  value,
  hasContribution,
  onChange,
}: {
  eventId: string;
  value: Closures;
  hasContribution: boolean;
  onChange: (v: Closures) => void;
}) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const save = async (patch: Partial<Closures>, message: string) => {
    setBusy(true);
    try {
      await api(`/api/admin/events/${eventId}`, { method: "PATCH", json: patch });
      onChange({ ...value, ...patch });
      toast({ title: message });
    } catch (err) {
      toast({ title: "Não foi possível alterar", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const row = (kind: Kind, title: string, closedText: string) => {
    const flagKey = `${kind}_closed` as const;
    const atKey = `${kind}_close_at` as const;
    const closed = isClosed(value[flagKey], value[atKey]);
    const scheduled = scheduledClose(value[atKey]);
    return (
      <div className="rounded-lg border p-3 space-y-2">
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="flex items-start gap-2 min-w-0">
            {closed ? <Lock className="w-4 h-4 mt-0.5 text-destructive shrink-0" /> : <LockOpen className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />}
            <span>
              <span className="block text-sm font-medium">
                {title}: {closed ? "encerradas" : "abertas"}
              </span>
              <span className="block text-xs text-muted-foreground">
                {closed ? closedText : scheduled ? `Encerra sozinho em ${fmtClose(scheduled)}.` : "Desligue para encerrar agora."}
              </span>
            </span>
          </span>
          <Switch
            checked={!closed}
            disabled={busy}
            aria-label={`${title} abertas`}
            // reabrir também apaga a programação (senão voltaria a fechar sozinho)
            onCheckedChange={(open) =>
              save(
                open ? { [flagKey]: false, [atKey]: null } : { [flagKey]: true },
                `${title} ${open ? "reabertas" : "encerradas"}`,
              )
            }
          />
        </label>
        {!closed && (
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              type="datetime-local"
              className="h-9 text-sm"
              aria-label={`Encerrar ${title.toLowerCase()} automaticamente em`}
              value={toLocalInput(value[atKey])}
              disabled={busy}
              onChange={(e) => {
                const at = e.target.value ? new Date(e.target.value).toISOString() : null;
                if (at && new Date(at).getTime() <= Date.now()) {
                  toast({ title: "Escolha um horário no futuro", variant: "destructive" });
                  return;
                }
                save({ [atKey]: at }, at ? `${title} vão encerrar em ${fmtClose(new Date(at))}` : "Programação removida");
              }}
            />
            {scheduled && (
              <Button type="button" variant="ghost" size="icon" className="shrink-0" disabled={busy} aria-label="Tirar a programação" title="Tirar a programação" onClick={() => save({ [atKey]: null }, "Programação removida")}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {row("registrations", "Inscrições", "Ninguém mais consegue se inscrever. Quem já se inscreveu continua vendo a inscrição.")}
        {hasContribution && row("contributions", "Contribuições", "O PIX e o “Já fiz o PIX” não aparecem mais. Você ainda pode marcar quem pagou.")}
      </div>
      <p className="text-xs text-muted-foreground">Para encerrar sozinho, escolha a data e a hora no campo com o relógio.</p>
    </div>
  );
}
