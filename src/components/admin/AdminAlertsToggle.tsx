"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/fetcher";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { useToast } from "@/hooks/use-toast";

async function deviceEndpoint() {
  try {
    if (!("serviceWorker" in navigator) || Notification.permission !== "granted") return null;
    const reg = await Promise.race([navigator.serviceWorker.ready, new Promise<null>((r) => setTimeout(() => r(null), 3000))]);
    return reg ? ((await reg.pushManager.getSubscription())?.endpoint ?? null) : null;
  } catch {
    return null;
  }
}

/** "Avisar este celular": notificação para a equipe quando alguém se inscreve ou informa um PIX. */
export function AdminAlertsToggle() {
  const push = usePushSubscription();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!push.ready) return;
    deviceEndpoint().then(async (endpoint) => {
      if (!endpoint) return setEnabled(false);
      const r = await api<{ enabled: boolean }>(`/api/admin/push-alerts?endpoint=${encodeURIComponent(endpoint)}`).catch(() => ({ enabled: false }));
      setEnabled(r.enabled);
    });
  }, [push.ready, push.isEnabled]);

  const toggle = async (on: boolean) => {
    setBusy(true);
    try {
      let endpoint = await deviceEndpoint();
      if (on && !endpoint) {
        if (!(await push.subscribe())) return;
        endpoint = await deviceEndpoint();
      }
      if (!endpoint) return;
      await api("/api/admin/push-alerts", { method: "POST", json: { endpoint, enabled: on } });
      setEnabled(on);
      toast({
        title: on ? "Avisos ativados neste celular" : "Avisos desativados neste celular",
        description: on ? "Mandamos uma notificação de teste agora." : undefined,
      });
    } catch (err) {
      toast({ title: "Não foi possível alterar", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const unsupported = push.ready && !push.isSupported;
  const blocked = push.ready && push.permission === "denied";

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
      <BellRing className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">Avisar este aparelho</p>
        <p className="text-sm text-muted-foreground">
          {unsupported
            ? "Este navegador não recebe notificações. No iPhone, instale o site (Compartilhar → Adicionar à Tela de Início) e abra o painel pelo app."
            : blocked
              ? "As notificações estão bloqueadas neste navegador. Libere nas configurações do site para ativar."
              : "Receba uma notificação quando alguém se inscrever num evento ou avisar que fez o PIX. Ative em cada celular da equipe."}
        </p>
      </div>
      {!unsupported && !blocked && (
        <div className="shrink-0 pt-0.5">
          {enabled === null || busy ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch checked={enabled} onCheckedChange={toggle} aria-label="Avisar este aparelho" />
          )}
        </div>
      )}
    </div>
  );
}
