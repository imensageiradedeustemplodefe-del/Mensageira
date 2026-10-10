"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, Search, Trash2, Eye, Users, Loader2, MessageCircle, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";
import { RATING_STYLES, ratingStyleOf } from "@/components/forms/RatingInput";
import { formatBRL, registrationCode } from "@/lib/pix";
import { formatPhoneBR, isPhoneFieldType } from "@/lib/phone";

interface Field {
  id: string;
  field_name: string;
  field_label: string;
  field_order: number;
  field_type?: string;
  field_options?: string[] | null;
}
interface Registration {
  id: string;
  registration_data: Record<string, unknown>;
  created_at: string;
  contribution_paid?: boolean;
  payment_reported_at?: string | null;
  push_endpoint?: string | null;
}

const show = (v: unknown) =>
  v === null || v === undefined || v === "" ? "—" : Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Sim" : "Não") : String(v);

/** Lista de inscritos de um evento: tabela com busca, detalhes, exclusão e exportação (CSV/PDF). */
export function RegistrationsList({
  eventId,
  eventTitle,
  maxParticipants,
  contributionCents,
  onChange,
}: {
  eventId: string;
  eventTitle?: string;
  maxParticipants?: number | null;
  /** valor da contribuição do evento (centavos); quando houver, aparece a coluna "Contribuição" */
  contributionCents?: number | null;
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
    const cols: { key: string; label: string; rating?: string; phone?: boolean }[] = fields.map((f) => ({
      key: f.field_name,
      label: f.field_label,
      phone: isPhoneFieldType(f.field_type),
      rating: f.field_type === "rating" ? RATING_STYLES[ratingStyleOf(f.field_options)].icons[4] : undefined,
    }));
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
    return rows.filter(
      (r) => registrationCode(r.id).toLowerCase().includes(q) || Object.values(r.registration_data ?? {}).some((v) => show(v).toLowerCase().includes(q))
    );
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

  const cellText = (c: { rating?: string; phone?: boolean }, v: unknown) =>
    c.rating && v !== undefined && v !== "" ? `${c.rating} ${v}/5` : c.phone && v ? formatPhoneBR(v) : show(v);

  // Média de cada pergunta de escala (0 a 5)
  const ratingAverages = columns
    .filter((c) => c.rating)
    .map((c) => {
      const nums = rows.map((r) => Number(r.registration_data?.[c.key])).filter((n) => !Number.isNaN(n) && n >= 0 && n <= 5);
      return { label: c.label, icon: c.rating!, avg: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null, n: nums.length };
    });

  const togglePaid = async (r: Registration) => {
    const next = !r.contribution_paid;
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, contribution_paid: next } : x)));
    try {
      const res = await api<{ notified?: boolean }>(`/api/admin/events/${eventId}/registrations/${r.id}`, { method: "PATCH", json: { contribution_paid: next } });
      if (next) {
        toast({
          title: "Pagamento confirmado",
          description: res?.notified
            ? "A pessoa recebeu uma notificação no celular."
            : "Ela não ativou as notificações — se quiser, avise pelo botão do WhatsApp ao lado.",
        });
      }
    } catch (err) {
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, contribution_paid: !next } : x)));
      toast({ title: "Não foi possível atualizar", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  };
  const paidCount = rows.filter((r) => r.contribution_paid).length;

  // Mensagem pronta no WhatsApp para o telefone que a pessoa informou
  const phoneCol = columns.find((c) => c.phone);
  const nameCol = columns.find((c) => !c.phone && !c.rating);
  const whatsappLink = (r: Registration) => {
    const digits = phoneCol ? String(r.registration_data?.[phoneCol.key] ?? "").replace(/\D/g, "") : "";
    if (digits.length < 10) return null;
    const name = nameCol ? String(r.registration_data?.[nameCol.key] ?? "").trim().split(/\s+/)[0] : "";
    const msg = `Olá${name ? ` ${name}` : ""}! Confirmamos o seu PIX de ${contributionCents ? formatBRL(contributionCents) : "contribuição"} para o ${eventTitle ?? "evento"} (código ${registrationCode(r.id)}). Obrigado e até lá! 🙏`;
    return `https://wa.me/${digits.startsWith("55") && digits.length > 11 ? digits : `55${digits}`}?text=${encodeURIComponent(msg)}`;
  };
  const toCheck = rows.filter((r) => !r.contribution_paid && r.payment_reported_at).length;

  const fmt = (d: string) => new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
  const vagas = maxParticipants ? Math.max(0, maxParticipants - rows.length) : null;

  return (
    <div className="space-y-4">
      {/* Resumo + exportação */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted rounded-lg">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Inscritos</p>
            <p className="text-2xl font-bold">
              {rows.length}
              {maxParticipants ? <span className="text-base font-normal text-muted-foreground"> / {maxParticipants}</span> : null}
            </p>
          </div>
          {contributionCents ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Contribuições ({formatBRL(contributionCents)})</p>
              <p className="text-2xl font-bold">
                {paidCount}
                <span className="text-base font-normal text-muted-foreground"> pagas • {formatBRL(paidCount * contributionCents)}</span>
              </p>
              {toCheck > 0 && (
                <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
                  {toCheck} {toCheck === 1 ? "pessoa avisou" : "pessoas avisaram"} que pagou — confira no extrato
                </p>
              )}
            </div>
          ) : null}
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

      {ratingAverages.some((a) => a.avg !== null) && (
        <div className="flex flex-wrap gap-2">
          {ratingAverages.map((a) =>
            a.avg === null ? null : (
              <div key={a.label} className="rounded-lg border px-3 py-2 text-sm">
                <span className="text-muted-foreground">{a.label}: </span>
                <strong>
                  {a.icon} {a.avg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} de 5
                </strong>
                <span className="text-xs text-muted-foreground"> (média de {a.n})</span>
              </div>
            )
          )}
        </div>
      )}

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
                {contributionCents ? <th className="px-3 py-2 font-medium whitespace-nowrap">Contribuição</th> : null}
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
                      {cellText(c, r.registration_data?.[c.key])}
                    </td>
                  ))}
                  {contributionCents ? (
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="mr-2 font-mono text-xs text-muted-foreground" title="Código que aparece no PIX (identificador)">
                        {registrationCode(r.id)}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePaid(r)}
                        title={
                          r.contribution_paid
                            ? "Clique para voltar para pendente"
                            : r.payment_reported_at
                              ? `Avisou que pagou em ${fmt(r.payment_reported_at)} — confira no extrato e clique para confirmar`
                              : "Clique para marcar como pago"
                        }
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border transition ${
                          r.contribution_paid
                            ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/40"
                            : r.payment_reported_at
                              ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/50 animate-pulse"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/40"
                        }`}
                      >
                        {r.contribution_paid ? "✓ Pago" : r.payment_reported_at ? "Informou PIX • Confirmar" : "Pendente"}
                      </button>
                      {r.push_endpoint && !r.contribution_paid && (
                        <span title="Será avisada por notificação no celular quando você confirmar">
                          <BellRing className="ml-1.5 inline w-3.5 h-3.5 text-primary" />
                        </span>
                      )}
                      {r.contribution_paid && whatsappLink(r) && (
                        <a
                          href={whatsappLink(r)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Avisar no WhatsApp que o pagamento foi confirmado"
                          className="ml-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-green-600 hover:bg-green-500/15 align-middle"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  ) : null}
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
                  <td colSpan={columns.slice(0, 4).length + 3 + (contributionCents ? 1 : 0)} className="px-3 py-6 text-center text-muted-foreground">
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
                  <p className="text-sm font-medium break-words">{cellText(c, viewing.registration_data?.[c.key])}</p>
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
