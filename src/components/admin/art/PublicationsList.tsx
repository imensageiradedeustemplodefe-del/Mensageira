"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/fetcher";
import type { Publication } from "@/components/admin/art/PublishDialog";
import { cn } from "@/lib/utils";

const tz = { timeZone: "America/Sao_Paulo" } as const;
const STATUS: Record<string, { label: string; className: string; Icon: typeof Clock }> = {
  agendado: { label: "Agendado", className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200", Icon: Clock },
  publicando: { label: "Publicando…", className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200", Icon: Loader2 },
  publicado: { label: "Publicado", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200", Icon: CheckCircle2 },
  parcial: { label: "Publicado em parte", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200", Icon: AlertTriangle },
  erro: { label: "Erro", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200", Icon: XCircle },
};
const KIND: Record<string, string> = { feed: "Feed", story: "Story", carrossel: "Carrossel" };

/** Publicações nas redes: agendadas (com cancelar) e as últimas publicadas. */
export function PublicationsList() {
  const [items, setItems] = useState<Publication[] | null>(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    api<{ configured: boolean; items: Publication[] }>("/api/admin/art/publish")
      .then((r) => {
        setItems(r.items);
        setConfigured(r.configured);
      })
      .catch(() => setItems([]));
  }, []);

  const remove = async (p: Publication) => {
    const msg = p.status === "agendado" ? `Cancelar o agendamento de "${p.title}"?` : `Tirar "${p.title}" da lista? (o que já foi publicado continua nas redes)`;
    if (!confirm(msg)) return;
    try {
      await api(`/api/admin/art/publish/${p.id}`, { method: "DELETE" });
      setItems((l) => l?.filter((x) => x.id !== p.id) ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover");
    }
  };

  if (!items) return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto my-8" />;
  const scheduled = items.filter((p) => p.status === "agendado" || p.status === "publicando").reverse();
  const done = items.filter((p) => !scheduled.includes(p));

  const row = (p: Publication) => {
    const st = STATUS[p.status] ?? STATUS.erro;
    return (
      <Card key={p.id}>
        <CardContent className="p-3 flex gap-3 items-start">
          <div className="flex -space-x-6 shrink-0">
            {p.images.slice(0, 3).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className="w-14 h-14 rounded-md object-cover border-2 border-background bg-muted" loading="lazy" />
            ))}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium truncate">{p.title}</span>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", st.className)}>
                <st.Icon className={cn("w-3 h-3", p.status === "publicando" && "animate-spin")} /> {st.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {KIND[p.kind] ?? p.kind} · {p.networks.map((n) => (n === "facebook" ? "Facebook" : "Instagram")).join(" e ")} ·{" "}
              {new Date(p.published_at ?? p.publish_at).toLocaleString("pt-BR", { ...tz, weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              {p.created_by ? ` · ${p.created_by}` : ""}
            </p>
            {p.result && p.status !== "publicado" && <p className="text-xs text-muted-foreground break-words">{p.result}</p>}
          </div>
          {p.status !== "publicando" && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => remove(p)}
              aria-label={p.status === "agendado" ? `Cancelar ${p.title}` : `Tirar ${p.title} da lista`}
              title={p.status === "agendado" ? "Cancelar agendamento" : "Tirar da lista"}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {!configured && (
        <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            A conexão com o Facebook e o Instagram ainda não foi configurada (o administrador coloca o token da página na Vercel). Os agendamentos ficam
            guardados e saem quando a conexão estiver pronta.
          </span>
        </div>
      )}
      <section className="space-y-2">
        <h3 className="font-semibold">Agendadas</h3>
        {scheduled.length ? scheduled.map(row) : <p className="text-sm text-muted-foreground">Nada agendado. Use “Publicar nas redes” em Criar arte ou Carrossel.</p>}
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold">Últimas publicações</h3>
        {done.length ? done.map(row) : <p className="text-sm text-muted-foreground">Nenhuma publicação ainda.</p>}
      </section>
    </div>
  );
}
