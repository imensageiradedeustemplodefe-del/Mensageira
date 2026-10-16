"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, RefreshCw, Search, Users, MessageCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/pix";
import type { PaymentStatus } from "@/lib/organizer-link";

export interface OrganizerRow {
  id: string;
  n: number;
  code: string;
  name: string;
  details: { label: string; value: string; phone: boolean }[];
  status: PaymentStatus;
  method: string | null;
  createdAt: string;
}

interface EventInfo {
  title: string;
  when: string;
  location: string | null;
  maxParticipants: number | null;
  contributionCents: number | null;
  contribution: string | null;
}

const STATUS: Record<PaymentStatus, { label: string; hint?: string; className: string }> = {
  paid: { label: "Pago", className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
  reported: { label: "Avisou que pagou o PIX", hint: "a igreja vai conferir", className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
  cash: { label: "Vai pagar em dinheiro", hint: "no dia do evento", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  pending: { label: "Aguardando pagamento", className: "bg-muted text-muted-foreground" },
};
const FILTERS: (PaymentStatus | "all")[] = ["all", "paid", "reported", "cash", "pending"];
const FILTER_LABEL: Record<PaymentStatus | "all", string> = {
  all: "Todos",
  paid: "Pagos",
  reported: "Avisaram PIX",
  cash: "Dinheiro no dia",
  pending: "Aguardando",
};

const whatsapp = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.length >= 10 ? `https://wa.me/${d.startsWith("55") && d.length > 11 ? d : `55${d}`}` : null;
};

/** Página das organizadoras: inscritos e situação dos pagamentos (só leitura, atualiza ao tocar no botão). */
export function OrganizerList({ event, rows, updatedAt }: { event: EventInfo; rows: OrganizerRow[]; updatedAt: string }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [filter, setFilter] = useState<PaymentStatus | "all">("all");
  const [query, setQuery] = useState("");
  const hasContribution = !!event.contributionCents;

  const count = (s: PaymentStatus) => rows.filter((r) => r.status === s).length;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === "all" || r.status === filter) &&
        (!q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || r.details.some((d) => d.value.toLowerCase().includes(q)))
    );
  }, [rows, filter, query]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-br from-primary/10 to-peaceful-blue/20 border-b">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-icon.png" alt="" width={48} height={48} className="rounded-full bg-white shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Inscrições • Organização</p>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{event.title}</h1>
            <p className="text-sm text-muted-foreground flex flex-wrap gap-x-3">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {event.when}
              </span>
              {event.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {event.location}
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Inscritos</p>
            <p className="text-2xl font-bold">
              {rows.length}
              {event.maxParticipants ? <span className="text-sm font-normal text-muted-foreground"> / {event.maxParticipants} vagas</span> : null}
            </p>
          </div>
          {hasContribution && (
            <>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Pagos</p>
                <p className="text-2xl font-bold text-green-600">{count("paid")}</p>
                <p className="text-xs text-muted-foreground">{formatBRL(count("paid") * (event.contributionCents ?? 0))}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Avisaram que pagaram o PIX</p>
                <p className="text-2xl font-bold text-sky-600">{count("reported")}</p>
                <p className="text-xs text-muted-foreground">a igreja confere no extrato</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Dinheiro no dia</p>
                <p className="text-2xl font-bold text-amber-600">{count("cash")}</p>
                <p className="text-xs text-muted-foreground">{formatBRL(count("cash") * (event.contributionCents ?? 0))} a receber</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
                <p className="text-2xl font-bold">{count("pending")}</p>
              </div>
            </>
          )}
        </div>
        {event.contribution && <p className="text-sm text-muted-foreground">Contribuição: {event.contribution}</p>}

        {/* Busca, filtros e atualizar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar nome, telefone ou código" className="pl-9" />
          </div>
          <Button variant="outline" onClick={() => startRefresh(() => router.refresh())} disabled={refreshing} className="gap-2 shrink-0">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>
        {hasContribution && (
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                className="h-8 rounded-full"
                onClick={() => setFilter(f)}
              >
                {FILTER_LABEL[f]}
                <span className="ml-1 opacity-70">{f === "all" ? rows.length : count(f)}</span>
              </Button>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">Atualizado às {updatedAt}. Toque em Atualizar para ver as novidades.</p>

        {/* Lista */}
        <ul className="space-y-2">
          {visible.map((r) => {
            const s = STATUS[r.status];
            return (
              <li key={r.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold leading-tight">
                    <span className="text-muted-foreground font-normal">{r.n}.</span> {r.name || "Sem nome"}
                  </p>
                  {hasContribution && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>
                      {s.label}
                      {r.status === "paid" && r.method ? ` (${r.method === "cash" ? "dinheiro" : "PIX"})` : ""}
                    </span>
                  )}
                </div>
                {r.details.length > 0 && (
                  <dl className="mt-1.5 grid gap-0.5 text-sm">
                    {r.details.map((d) => {
                      const wa = d.phone ? whatsapp(d.value) : null;
                      return (
                        <div key={d.label} className="flex flex-wrap items-center gap-x-1">
                          <dt className="text-muted-foreground">{/[?:]$/.test(d.label) ? d.label : `${d.label}:`}</dt>
                          <dd>
                            {wa ? (
                              <a
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-0 min-w-0 items-center gap-1 py-0.5 text-green-700 dark:text-green-400 underline-offset-2 hover:underline"
                              >
                                {d.value} <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              d.value
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {hasContribution && <>Código do PIX {r.code} • </>}Inscrição em {r.createdAt}
                  {hasContribution && s.hint ? ` • ${s.hint}` : ""}
                </p>
              </li>
            );
          })}
          {visible.length === 0 && (
            <li className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              {rows.length === 0 ? "Ninguém se inscreveu ainda." : "Ninguém nesta situação."}
            </li>
          )}
        </ul>

        <p className="flex items-start gap-2 text-xs text-muted-foreground border-t pt-4">
          <Eye className="w-4 h-4 shrink-0" />
          Página só para acompanhar: os pagamentos são confirmados pela equipe da igreja. Não compartilhe este link — ele mostra os dados de
          quem se inscreveu.
        </p>
      </main>
    </div>
  );
}
