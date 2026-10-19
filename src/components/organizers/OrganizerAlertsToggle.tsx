"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/fetcher";
import { currentPushEndpoint, usePushSubscription } from "@/hooks/usePushSubscription";

/** "Avisar este celular" no link das organizadoras: notificação quando alguém se inscreve ou informa o PIX deste evento. */
export function OrganizerAlertsToggle({ apiBase }: { apiBase: string }) {
  const push = usePushSubscription();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!push.ready) return;
    currentPushEndpoint().then(async (endpoint) => {
      if (!endpoint) return setEnabled(false);
      const r = await api<{ enabled: boolean }>(`${apiBase}/alerts?endpoint=${encodeURIComponent(endpoint)}`).catch(() => ({ enabled: false }));
      setEnabled(r.enabled);
    });
  }, [push.ready, push.isEnabled, apiBase]);

  const toggle = async (on: boolean) => {
    setBusy(true);
    try {
      let endpoint = await currentPushEndpoint();
      if (on && !endpoint) {
        if (!(await push.subscribe())) return;
        endpoint = await currentPushEndpoint();
      }
      if (!endpoint) return;
      await api(`${apiBase}/alerts`, { method: "POST", json: { endpoint, enabled: on } });
      setEnabled(on);
      toast.success(on ? "Avisos ativados neste celular — mandamos uma notificação de teste." : "Avisos desativados neste celular");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível alterar");
    } finally {
      setBusy(false);
    }
  };

  const unsupported = push.ready && !push.isSupported;
  const blocked = push.ready && push.permission === "denied";

  return (
    <div className="flex items-start gap-3 rounded-xl border p-3">
      <BellRing className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">Avisar este celular</p>
        <p className="text-sm text-muted-foreground">
          {unsupported
            ? "Este navegador não recebe notificações. No iPhone, adicione o site à Tela de Início (Compartilhar → Adicionar à Tela de Início) e abra este link por lá."
            : blocked
              ? "As notificações estão bloqueadas neste navegador. Libere nas configurações do site para ativar."
              : "Receba uma notificação quando alguém se inscrever ou avisar que fez o PIX."}
        </p>
      </div>
      {!unsupported && !blocked && (
        <div className="shrink-0 pt-0.5">
          {enabled === null || busy ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch checked={enabled} onCheckedChange={toggle} aria-label="Avisar este celular" />
          )}
        </div>
      )}
    </div>
  );
}
