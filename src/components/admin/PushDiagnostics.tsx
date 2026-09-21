"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Bell, BellOff, Loader2, RefreshCw, Send, Smartphone, Sun } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/fetcher";
import { usePushSubscription } from "@/hooks/usePushSubscription";

interface PushLog {
  id: string;
  source: string;
  title: string;
  body: string;
  sent: number;
  failed: number;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  by_platform: Record<string, number>;
  vapid_configured: boolean;
  cron_secret_configured: boolean;
  logs: PushLog[];
}

const SOURCE_LABEL: Record<string, string> = {
  cron: "Automático (07:00)",
  manual: "Envio diário manual",
  teste: "Teste",
  live: "Ao vivo",
  testemunho: "Testemunho",
  personalizada: "Personalizada",
  galeria: "Galeria",
};

export function PushDiagnostics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const push = usePushSubscription();

  const load = useCallback(async () => {
    try {
      setStats(await api<Stats>("/api/admin/push"));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar diagnóstico das notificações");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const testThisDevice = async () => {
    setBusy("device");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        toast.error("Este aparelho não está inscrito. Ative as notificações pelo sino primeiro.");
        return;
      }
      const r = await api<{ success: boolean }>("/api/admin/push/test", { method: "POST", json: { endpoint: sub.endpoint } });
      if (r.success) toast.success("Teste enviado para este aparelho. Deve chegar em alguns segundos.");
      else toast.error("O envio falhou — o navegador recusou o push. Desative e ative as notificações de novo.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar teste");
    } finally {
      setBusy(null);
    }
  };

  const testAll = async () => {
    if (!confirm("Enviar uma notificação de TESTE para todos os inscritos?")) return;
    setBusy("all");
    try {
      const r = await api<{ sent: number; failed: number }>("/api/admin/push/test", { method: "POST", json: {} });
      toast.success(`Teste enviado: ${r.sent} entregues, ${r.failed} falharam`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar teste");
    } finally {
      setBusy(null);
    }
  };

  const runDaily = async () => {
    if (!confirm("Enviar AGORA o versículo do dia e os avisos de eventos de hoje para todos os inscritos?")) return;
    setBusy("daily");
    try {
      const r = await api<{ verse?: { sent: number; failed: number }; events: { sent: number; failed: number }[] }>("/api/admin/push/daily", { method: "POST" });
      const ev = r.events?.length ?? 0;
      toast.success(`Envio diário concluído: versículo para ${r.verse?.sent ?? 0} pessoas, ${ev} evento(s) de hoje avisado(s)`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no envio diário");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Diagnóstico das Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading || !stats ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Inscritos ativos</p>
                <p className="text-2xl font-bold text-primary">{stats.active}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Inativos (expirados)</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
              </div>
              <div className="rounded-lg border p-3 col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Por plataforma</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.by_platform).length === 0 && <span className="text-sm text-muted-foreground">—</span>}
                  {Object.entries(stats.by_platform).map(([k, v]) => (
                    <Badge key={k} variant="secondary">{k}: {v}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant={stats.vapid_configured ? "default" : "destructive"}>Chaves de envio {stats.vapid_configured ? "OK" : "faltando"}</Badge>
              <Badge variant={stats.cron_secret_configured ? "default" : "destructive"}>Envio automático {stats.cron_secret_configured ? "configurado (07:00)" : "sem segredo"}</Badge>
              <Badge variant={push.isEnabled ? "default" : "outline"}>
                {push.isEnabled ? <Bell className="h-3 w-3 mr-1" /> : <BellOff className="h-3 w-3 mr-1" />}
                Este aparelho: {push.isEnabled ? "inscrito" : "não inscrito"}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={testThisDevice} disabled={!!busy || !push.isEnabled}>
                {busy === "device" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Smartphone className="h-4 w-4 mr-2" />}
                Testar neste aparelho
              </Button>
              <Button size="sm" variant="outline" onClick={testAll} disabled={!!busy}>
                {busy === "all" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Testar para todos
              </Button>
              <Button size="sm" variant="outline" onClick={runDaily} disabled={!!busy}>
                {busy === "daily" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sun className="h-4 w-4 mr-2" />}
                Enviar versículo e eventos de hoje agora
              </Button>
              <Button size="sm" variant="ghost" onClick={load} disabled={!!busy}>
                <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Últimos envios</p>
              {stats.logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum envio registrado ainda.</p>
              ) : (
                <div className="rounded-lg border divide-y max-h-80 overflow-y-auto">
                  {stats.logs.map((l) => (
                    <div key={l.id} className="p-3 text-sm flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{l.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{l.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(l.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • {SOURCE_LABEL[l.source] ?? l.source}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-green-600 font-medium">{l.sent} ✓</p>
                        {l.failed > 0 && <p className="text-red-500 text-xs">{l.failed} falhou</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
