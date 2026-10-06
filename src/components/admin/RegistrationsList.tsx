"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, Search, Trash2, Eye, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";

interface Field {
  id: string;
  field_name: string;
  field_label: string;
  field_order: number;
}
interface Registration {
  id: string;
  registration_data: Record<string, unknown>;
  created_at: string;
}

const show = (v: unknown) =>
  v === null || v === undefined || v === "" ? "—" : Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Sim" : "Não") : String(v);

/** Lista de inscritos de um evento: tabela com busca, detalhes, exclusão e exportação (CSV/PDF). */
export function RegistrationsList({
  eventId,
  eventTitle,
  maxParticipants,
  onChange,
}: {
  eventId: string;
  eventTitle?: string;
  maxParticipants?: number | null;
  onChange?: () => void;
}) {
  const [fields, setFields] = useState<Field[]>([]);
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<Registration | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, r] = await Promise.all([
        api<Field[]>(`/api/admin/events/${eventId}/fields`),
        api<Registration[]>(`/api/admin/events/${eventId}/registrations`),
      ]);
      setFields([...f].sort((a, b) => a.field_order - b.field_order));
      setRows([...r].sort((a, b) => a.created_at.localeCompare(b.created_at)));
    } catch (err) {
      toast({ title: "Erro ao carregar inscrições", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Colunas: campos do formulário + dados extras que não sejam campos
  const columns = useMemo(() => {
    const cols = fields.map((f) => ({ key: f.field_name, label: f.field_label }));
    const known = new Set(cols.map((c) => c.key));
    for (const r of rows) {
      for (const k of Object.keys(r.registration_data ?? {})) {
        if (known.has(k)) continue;
        known.add(k);
        cols.push({ key: k, label: k.replace(/_/g, " ") });
      }
    }
    return cols;
  }, [fields, rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => Object.values(r.registration_data ?? {}).some((v) => show(v).toLowerCase().includes(q)));
  }, [rows, query]);

  const remove = async (r: Registration) => {
    const name = show(r.registration_data?.[columns[0]?.key]);
    if (!confirm(`Excluir a inscrição de ${name}? Esta ação não pode ser desfeita.`)) return;
    try {
      await api(`/api/admin/events/${eventId}/registrations/${r.id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((x) => x.id !== r.id));
      setViewing(null);
      toast({ title: "Inscrição excluída" });
      onChange?.();
    } catch (err) {
      toast({ title: "Erro ao excluir", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
  const vagas = maxParticipants ? Math.max(0, maxParticipants - rows.length) : null;

  return (
    <div className="space-y-4">
      {/* Resumo + exportação */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted rounded-lg">
        <div className="flex gap-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Inscritos</p>
            <p className="text-2xl font-bold">
              {rows.length}
              {maxParticipants ? <span className="text-base font-normal text-muted-foreground"> / {maxParticipants}</span> : null}
            </p>
          </div>
          {vagas !== null && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Vagas restantes</p>
              <p className={`text-2xl font-bold ${vagas === 0 ? "text-destructive" : "text-green-600"}`}>{vagas === 0 ? "Esgotado" : vagas}</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/admin/events/${eventId}/registrations/export`} download>
            <Button variant="outline" className="gap-2" disabled={rows.length === 0}>
              <Download className="w-4 h-4" /> Excel (CSV)
            </Button>
          </a>
          <a href={`/admin/inscricoes/${eventId}/imprimir`} target="_blank" rel="noopener noreferrer">
            <Button className="gap-2" disabled={rows.length === 0}>
              <FileText className="w-4 h-4" /> PDF / Imprimir
            </Button>
          </a>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, telefone…" className="pl-9" />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando inscrições…
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          Nenhuma inscrição ainda{eventTitle ? ` em “${eventTitle}”` : ""}.
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-3 py-2 font-medium w-10">Nº</th>
                {columns.slice(0, 4).map((c) => (
                  <th key={c.key} className="px-3 py-2 font-medium whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium whitespace-nowrap">Inscrito em</th>
                <th className="px-3 py-2 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-muted-foreground">{rows.indexOf(r) + 1}</td>
                  {columns.slice(0, 4).map((c) => (
                    <td key={c.key} className="px-3 py-2 max-w-[220px] truncate">
                      {show(r.registration_data?.[c.key])}
                    </td>
                  ))}
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{fmt(r.created_at)}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewing(r)} title="Ver tudo">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(r)} title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={columns.slice(0, 4).length + 3} className="px-3 py-6 text-center text-muted-foreground">
                    Ninguém encontrado para “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {columns.length > 4 && rows.length > 0 && (
        <p className="text-xs text-muted-foreground">A tabela mostra os 4 primeiros campos. Use o olho para ver tudo, ou exporte para ter todas as colunas.</p>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inscrição Nº {viewing ? rows.indexOf(viewing) + 1 : ""}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Inscrito em {fmt(viewing.created_at)}</p>
              {columns.map((c) => (
                <div key={c.key} className="p-3 border-l-4 border-primary bg-muted/30 rounded-r">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">{c.label}</p>
                  <p className="text-sm font-medium break-words">{show(viewing.registration_data?.[c.key])}</p>
                </div>
              ))}
              <Button variant="destructive" className="w-full" onClick={() => remove(viewing)}>
                <Trash2 className="w-4 h-4 mr-2" /> Excluir inscrição
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
