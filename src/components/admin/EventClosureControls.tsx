"use client";

import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";

export interface Closures {
  registrations_closed: boolean;
  contributions_closed: boolean;
}

/**
 * Chaves para encerrar (e reabrir) as inscrições e as contribuições de um evento.
 * Inscrições encerradas: ninguém mais se inscreve. Contribuições encerradas: some o PIX e o "Já fiz o PIX".
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
  const [busy, setBusy] = useState<keyof Closures | null>(null);
  const { toast } = useToast();

  const toggle = async (key: keyof Closures, closed: boolean) => {
    setBusy(key);
    try {
      await api(`/api/admin/events/${eventId}`, { method: "PATCH", json: { [key]: closed } });
      onChange({ ...value, [key]: closed });
      const what = key === "registrations_closed" ? "Inscrições" : "Contribuições";
      toast({ title: `${what} ${closed ? "encerradas" : "reabertas"}` });
    } catch (err) {
      toast({ title: "Não foi possível alterar", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const row = (key: keyof Closures, title: string, closedText: string, openText: string) => {
    const closed = value[key];
    return (
      <label className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer">
        <span className="flex items-start gap-2 min-w-0">
          {closed ? <Lock className="w-4 h-4 mt-0.5 text-destructive shrink-0" /> : <LockOpen className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />}
          <span>
            <span className="block text-sm font-medium">
              {title}: {closed ? "encerradas" : "abertas"}
            </span>
            <span className="block text-xs text-muted-foreground">{closed ? closedText : openText}</span>
          </span>
        </span>
        <Switch checked={!closed} disabled={busy !== null} onCheckedChange={(open) => toggle(key, !open)} aria-label={`${title} abertas`} />
      </label>
    );
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {row(
        "registrations_closed",
        "Inscrições",
        "Ninguém mais consegue se inscrever. Quem já se inscreveu continua vendo a inscrição.",
        "Desligue para encerrar a confirmação de presença.",
      )}
      {hasContribution &&
        row(
          "contributions_closed",
          "Contribuições",
          "O PIX e o “Já fiz o PIX” não aparecem mais. Você ainda pode marcar quem pagou.",
          "Desligue para encerrar o recebimento das contribuições.",
        )}
    </div>
  );
}
