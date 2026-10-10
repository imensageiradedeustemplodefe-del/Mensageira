"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, ClipboardList, Loader2, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/fetcher";
import { EventRegistrationManager } from "./EventRegistrationManager";

interface Row {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  max_participants: number | null;
  contribution_cents: number | null;
  registration_required: boolean;
  is_published: boolean;
  registrations: number;
  fields: number;
  last_registration_at: string | null;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Aba "Inscrições" do painel: eventos com inscrição, contagem de inscritos e acesso à lista. */
export function RegistrationsOverview() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Row | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api<Row[]>("/api/admin/registrations"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (selected) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => {
            setSelected(null);
            load();
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Todos os eventos com inscrição
        </Button>
        <Card>
          <CardContent className="p-5 space-y-1">
            <h2 className="text-xl font-bold">{selected.title}</h2>
            <p className="text-sm text-muted-foreground capitalize">
              {fmtDate(selected.event_date)}
              {selected.location ? ` • ${selected.location}` : ""}
            </p>
          </CardContent>
        </Card>
        <EventRegistrationManager eventId={selected.id} eventTitle={selected.title} maxParticipants={selected.max_participants} contributionCents={selected.contribution_cents} defaultTab="registrations" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
      </div>
    );
  }

  const now = Date.now();
  const upcoming = rows.filter((r) => new Date(r.event_date).getTime() >= now - 6 * 3600_000);
  const past = rows.filter((r) => new Date(r.event_date).getTime() < now - 6 * 3600_000).reverse();

  const card = (r: Row) => {
    const pct = r.max_participants ? Math.min(100, Math.round((r.registrations / r.max_participants) * 100)) : null;
    const full = r.max_participants !== null && r.registrations >= r.max_participants;
    return (
      <Card key={r.id} className="cursor-pointer hover:shadow-md hover:border-primary/40 transition" onClick={() => setSelected(r)}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 capitalize">
                <CalendarDays className="w-3.5 h-3.5" /> {fmtDate(r.event_date)}
              </p>
              {r.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {r.location}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold leading-none">{r.registrations}</p>
              <p className="text-xs text-muted-foreground">{r.max_participants ? `de ${r.max_participants}` : "inscritos"}</p>
            </div>
          </div>
          {pct !== null && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${full ? "bg-destructive" : "bg-primary"}`} style={{ width: `${pct}%` }} />
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {full && <Badge variant="destructive">Esgotado</Badge>}
            {!r.is_published && <Badge variant="outline">Não publicado</Badge>}
            {r.fields === 0 && <Badge variant="outline" className="text-orange-600 border-orange-600">Formulário sem campos</Badge>}
            {r.last_registration_at && (
              <Badge variant="secondary">Última inscrição: {new Date(r.last_registration_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {rows.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground space-y-2">
            <ClipboardList className="w-10 h-10 mx-auto opacity-50" />
            <p>Nenhum evento com inscrição ainda.</p>
            <p className="text-sm">
              Para abrir inscrições, vá em <strong>Eventos</strong>, edite o evento e marque <strong>“Inscrição obrigatória”</strong>. Depois monte o
              formulário em “Inscrições → Campos”.
            </p>
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Próximos eventos ({upcoming.length})
          </h3>
          <div className="grid gap-3 md:grid-cols-2">{upcoming.map(card)}</div>
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-semibold text-muted-foreground">Eventos encerrados ({past.length})</h3>
          <div className="grid gap-3 md:grid-cols-2 opacity-90">{past.map(card)}</div>
        </section>
      )}
    </div>
  );
}
