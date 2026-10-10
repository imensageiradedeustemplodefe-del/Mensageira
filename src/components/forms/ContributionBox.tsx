"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PixPayment } from "@/components/forms/PixPayment";
import { api, ApiError } from "@/lib/fetcher";
import { formatBRL, registrationCode } from "@/lib/pix";

interface Status {
  code: string;
  contribution_paid: boolean;
  payment_reported_at: string | null;
}

// Inscrições feitas neste aparelho, para a pessoa ver depois se o pagamento foi confirmado.
const STORAGE_KEY = "mensageira:inscricoes";
export interface SavedRegistration {
  id: string;
  label?: string;
}

export function getSavedRegistrations(eventId: string): SavedRegistration[] {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, SavedRegistration[]>;
    return Array.isArray(all[eventId]) ? all[eventId] : [];
  } catch {
    return [];
  }
}

export function saveRegistration(eventId: string, reg: SavedRegistration) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, SavedRegistration[]>;
    all[eventId] = [...(all[eventId] ?? []).filter((r) => r.id !== reg.id), reg];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

function forgetRegistration(eventId: string, id: string) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, SavedRegistration[]>;
    all[eventId] = (all[eventId] ?? []).filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

/** Caixa da contribuição de uma inscrição: PIX, botão "Já fiz o PIX" e a situação (aguardando / confirmado). */
export function ContributionBox({
  eventId,
  eventTitle,
  registrationId,
  label,
  amountCents,
  note,
  onMissing,
}: {
  eventId: string;
  eventTitle: string;
  registrationId: string;
  label?: string;
  amountCents: number;
  note?: string | null;
  onMissing?: () => void;
}) {
  const code = registrationCode(registrationId);
  const [status, setStatus] = useState<Status | null>(null);
  const [reporting, setReporting] = useState(false);
  const url = `/api/events/${eventId}/registrations/${registrationId}`;

  const load = useCallback(async () => {
    try {
      setStatus(await api<Status>(url, { cache: "no-store" }));
    } catch (err) {
      // Inscrição apagada pela equipe: some deste aparelho
      if (err instanceof ApiError && err.status === 404) {
        forgetRegistration(eventId, registrationId);
        onMissing?.();
      }
    }
  }, [url, eventId, registrationId, onMissing]);

  useEffect(() => {
    load();
  }, [load]);

  // Enquanto não for confirmado, confere de tempos em tempos (a equipe pode confirmar com a página aberta)
  const paid = !!status?.contribution_paid;
  useEffect(() => {
    if (paid) return;
    const t = setInterval(() => document.visibilityState === "visible" && load(), 20_000);
    // voltou para o app/aba (ex.: depois de pagar no app do banco): confere na hora
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [paid, load]);

  const report = async () => {
    setReporting(true);
    try {
      setStatus(await api<Status>(url, { method: "PATCH" }));
    } finally {
      setReporting(false);
    }
  };

  const reported = !!status?.payment_reported_at;

  return (
    <div className="rounded-xl border border-[#32BCAD]/40 bg-[#32BCAD]/10 p-5 text-left space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-semibold">Contribuição: {formatBRL(amountCents)}</p>
        <p className="text-xs text-muted-foreground">
          {label ? `${label} • ` : ""}código <strong className="font-mono tracking-wider text-foreground">{code}</strong>
        </p>
      </div>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}

      {!status ? (
        <div className="flex justify-center py-2">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : paid ? (
        <div className="flex items-center gap-3 rounded-lg bg-green-500/15 border border-green-500/40 p-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-700 dark:text-green-400">Pagamento confirmado!</p>
            <p className="text-sm text-muted-foreground">Obrigado pela sua contribuição. Está tudo certo para o evento.</p>
          </div>
        </div>
      ) : reported ? (
        <div className="flex items-center gap-3 rounded-lg bg-sky-500/10 border border-sky-500/40 p-3">
          <Clock className="w-6 h-6 text-sky-600 shrink-0" />
          <div>
            <p className="font-semibold">Recebemos seu aviso de pagamento</p>
            <p className="text-sm text-muted-foreground">A equipe vai conferir o PIX e confirmar. Esta tela se atualiza sozinha.</p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Se quiser já deixar acertado, pague pelo PIX — o código vai junto para identificarmos você:</p>
          <PixPayment
            amountCents={amountCents}
            note={note}
            txid={`INSC${code}`}
            description={`Inscricao ${code}`}
            className="w-full"
          />
          <Button type="button" variant="outline" className="w-full gap-2" onClick={report} disabled={reporting}>
            {reporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Já fiz o PIX
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            Depois de pagar, toque em “Já fiz o PIX” para avisar a equipe do {eventTitle}.
          </p>
        </>
      )}
    </div>
  );
}
