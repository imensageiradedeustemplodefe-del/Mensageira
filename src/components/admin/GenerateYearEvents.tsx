"use client";

import { useState } from "react";
import { CalendarPlus, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";

interface RuleSummary {
  title: string;
  rule: string;
  total: number;
  toCreate: number;
}
interface Preview {
  year: number;
  total: number;
  toCreate: number;
  existing: number;
  byRule: RuleSummary[];
}

/** Botão do painel: gera de uma vez os eventos fixos (cultos, Santa Ceia, Louvorzão, Lavacar) de um ano. */
export function GenerateYearEvents({ onDone }: { onDone?: () => void }) {
  const thisYear = new Date().getFullYear();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(String(new Date().getMonth() >= 9 ? thisYear + 1 : thisYear));
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const loadPreview = async (y: string) => {
    setLoading(true);
    setPreview(null);
    try {
      setPreview(await api<Preview>("/api/admin/events/generate", { method: "POST", json: { year: Number(y), preview: true } }));
    } catch (err) {
      toast({ title: "Erro ao calcular", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    setCreating(true);
    try {
      const r = await api<{ created: number; skipped: number }>("/api/admin/events/generate", {
        method: "POST",
        json: { year: Number(year) },
      });
      toast({
        title: r.created ? `${r.created} eventos criados para ${year}!` : "Nada para criar",
        description: r.skipped ? `${r.skipped} já existiam e foram mantidos.` : undefined,
      });
      setOpen(false);
      onDone?.();
    } catch (err) {
      toast({ title: "Erro ao criar eventos", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) loadPreview(year);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarPlus className="w-4 h-4 mr-2" />
          Gerar eventos fixos do ano
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerar eventos fixos do ano</DialogTitle>
          <DialogDescription>
            Cria a programação fixa da igreja para o ano escolhido. Eventos que já existem são mantidos (não duplica). Eventos que
            não são fixos (Chá das Mulheres, conferências…) continuam sendo cadastrados em “Novo Evento”.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Ano:</span>
            <Select
              value={year}
              onValueChange={(v) => {
                setYear(v);
                loadPreview(v);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[thisYear, thisYear + 1, thisYear + 2].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Calculando…
            </div>
          )}

          {preview && !loading && (
            <>
              <div className="rounded-lg border divide-y text-sm">
                {preview.byRule.map((r) => (
                  <div key={r.title} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.rule}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold ${r.toCreate ? "text-primary" : "text-muted-foreground"}`}>
                      {r.toCreate ? `+${r.toCreate} novos` : "já criados"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {preview.toCreate > 0 ? (
                  <>
                    Serão criados <strong className="text-foreground">{preview.toCreate} eventos</strong> em {preview.year}
                    {preview.existing > 0 ? ` (${preview.existing} já existem e serão mantidos)` : ""}.
                    {preview.year === thisYear ? " No ano atual, só a partir de hoje." : ""}
                  </>
                ) : (
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" /> Todos os eventos fixos de {preview.year} já estão cadastrados.
                  </span>
                )}
              </p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={create} disabled={creating || loading || !preview || preview.toCreate === 0}>
            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarPlus className="w-4 h-4 mr-2" />}
            {preview?.toCreate ? `Criar ${preview.toCreate} eventos` : "Criar eventos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
