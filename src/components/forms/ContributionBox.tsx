"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, Bell, BellRing, CheckCircle2, Clock, Loader2, QrCode, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PixPayment } from "@/components/forms/PixPayment";
import { api, ApiError } from "@/lib/fetcher";
import { formatBRL, registrationCode } from "@/lib/pix";
import { usePushSubscription } from "@/hooks/usePushSubscription";

interface Status {
  code: string;
  contribution_paid: boolean;
  payment_reported_at: string | null;
  payment_method?: "pix" | "cash" | null;
  notify?: boolean;
}

/** Endpoint da assinatura de notificação deste aparelho (se as notificações estiverem ativas). */
async function currentPushEndpoint() {
  try {
    if (!("serviceWorker" in navigator) || !("Notification" in window) || Notification.permission !== "granted") return null;
    // sem service worker registrado o "ready" nunca resolve: não pode travar o "Já fiz o PIX"
    const reg = await Promise.race([navigator.serviceWorker.ready, new Promise<null>((r) => setTimeout(() => r(null), 3000))]);
    if (!reg) return null;
    return (await reg.pushManager.getSubscription())?.endpoint ?? null;
  } catch {
    return null;
  }
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

/** Caixa da contribuição de uma inscrição: escolha PIX ou dinheiro, botão "Já fiz o PIX" e a situação (aguardando / confirmado). */
export function ContributionBox({
  eventId,
  eventTitle,
  registrationId,
  label,
  amountCents,
  note,
  receiver,
  onMissing,
}: {
  eventId: string;
  eventTitle: string;
  registrationId: string;
  label?: string;
  amountCents: number;
  note?: string | null;
  receiver?: { key?: string | null; name?: string | null; city?: string | null };
  onMissing?: () => void;
}) {
  const code = registrationCode(registrationId);
  const [status, setStatus] = useState<Status | null>(null);
  const [reporting, setReporting] = useState(false);
  const push = usePushSubscription();
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
      const endpoint = await currentPushEndpoint();
      setStatus(await api<Status>(url, { method: "PATCH", json: { report: true, ...(endpoint ? { push_endpoint: endpoint } : {}) } }));
    } finally {
      setReporting(false);
    }
  };

  const choose = async (method: "pix" | "cash") => {
    setReporting(true);
    try {
      const endpoint = await currentPushEndpoint();
      setStatus(await api<Status>(url, { method: "PATCH", json: { payment_method: method, ...(endpoint ? { push_endpoint: endpoint } : {}) } }));
    } finally {
      setReporting(false);
    }
  };

  // Notificações já ativas neste aparelho: liga à inscrição para avisar quando confirmarem
  const needsLink = !!status && !status.contribution_paid && !status.notify;
  useEffect(() => {
    if (!needsLink || !push.isEnabled) return;
    currentPushEndpoint().then((endpoint) => {
      if (endpoint) api<Status>(url, { method: "PATCH", json: { push_endpoint: endpoint } }).then(setStatus).catch(() => {});
    });
  }, [needsLink, push.isEnabled, url]);

  const askNotify = async () => {
    if (await push.subscribe()) {
      const endpoint = await currentPushEndpoint();
      if (endpoint) setStatus(await api<Status>(url, { method: "PATCH", json: { push_endpoint: endpoint } }));
    }
  };

  const reported = !!status?.payment_reported_at;
  const notifyLine =
    !status || paid ? null : status.notify ? (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <BellRing className="w-3.5 h-3.5 text-primary" /> Você vai receber uma notificação no celular quando confirmarmos.
      </p>
    ) : push.ready && push.isSupported && push.permission !== "denied" ? (
      <Button type="button" variant="ghost" size="sm" className="w-full gap-2 text-primary" onClick={askNotify} disabled={push.busy}>
        {push.busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
        Me avise no celular quando confirmarem
      </Button>
    ) : null;

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
        <>
          <div className="flex items-center gap-3 rounded-lg bg-sky-500/10 border border-sky-500/40 p-3">
            <Clock className="w-6 h-6 text-sky-600 shrink-0" />
            <div>
              <p className="font-semibold">Recebemos seu aviso de pagamento</p>
              <p className="text-sm text-muted-foreground">A equipe vai conferir o PIX e confirmar. Esta tela se atualiza sozinha.</p>
            </div>
          </div>
          {notifyLine}
        </>
      ) : status.payment_method === "cash" ? (
        <>
          <div className="flex items-center gap-3 rounded-lg bg-amber-500/10 border border-amber-500/40 p-3">
            <Banknote className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold">Combinado: pagamento em dinheiro</p>
              <p className="text-sm text-muted-foreground">
                Leve {formatBRL(amountCents)} no dia do evento e entregue para a equipe. Assim que recebermos, confirmamos aqui.
              </p>
            </div>
          </div>
          {notifyLine}
          <Button type="button" variant="link" size="sm" className="w-full" onClick={() => choose("pix")} disabled={reporting}>
            Prefiro pagar com PIX
          </Button>
        </>
      ) : status.payment_method !== "pix" ? (
        <>
          <p className="text-sm text-muted-foreground">Como você prefere pagar?</p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" className="h-auto flex-col gap-1 py-3 bg-[#32BCAD] hover:bg-[#2aa496] text-white" onClick={() => choose("pix")} disabled={reporting}>
              <QrCode className="w-5 h-5" />
              <span className="font-semibold">PIX</span>
              <span className="text-[11px] font-normal opacity-90">pagar agora</span>
            </Button>
            <Button type="button" variant="outline" className="h-auto flex-col gap-1 py-3" onClick={() => choose("cash")} disabled={reporting}>
              <Banknote className="w-5 h-5 text-amber-600" />
              <span className="font-semibold">Dinheiro</span>
              <span className="text-[11px] font-normal text-muted-foreground">no dia do evento</span>
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Pague pelo PIX — o código vai junto para identificarmos você:</p>
          <PixPayment
            amountCents={amountCents}
            note={note}
            txid={`INSC${code}`}
            description={`Inscricao ${code}`}
            receiver={receiver}
            className="w-full"
          />
          <Button type="button" variant="outline" className="w-full gap-2" onClick={report} disabled={reporting}>
            {reporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Já fiz o PIX
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            Depois de pagar, toque em “Já fiz o PIX” para avisar a equipe do {eventTitle}.
          </p>
          {notifyLine}
          <Button type="button" variant="link" size="sm" className="w-full" onClick={() => choose("cash")} disabled={reporting}>
            Prefiro pagar em dinheiro no dia
          </Button>
        </>
      )}
    </div>
  );
}
