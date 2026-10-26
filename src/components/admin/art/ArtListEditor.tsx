"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/fetcher";
import type { ArtSpec } from "@/lib/art/spec";

type Item = ArtSpec["items"][number];
export interface ListEvent {
  id: string;
  title: string;
  event_date: string;
  is_published: boolean;
}

const tz = "America/Sao_Paulo";
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

/** Partes da data no horário de Brasília */
function parts(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { y: +p.year, m: +p.month, d: +p.day, weekday, hour: +p.hour % 24, minute: +p.minute, key: `${p.year}-${p.month}-${p.day}` };
}
const hourLabel = (h: number, m: number) => `${h}h${m ? String(m).padStart(2, "0") : ""}`;
const shortDate = (x: ReturnType<typeof parts>) => `${x.d} ${MONTHS[x.m - 1].slice(0, 3).toLowerCase()}`;

/** Lista de linhas (programação / aniversariantes) com preenchimento automático. */
export function ArtListEditor({ spec, set, events }: { spec: ArtSpec; set: (p: Partial<ArtSpec>) => void; events: ListEvent[] }) {
  const [loading, setLoading] = useState(false);
  const items = spec.items;
  const update = (i: number, patch: Partial<Item>) => set({ items: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  const isBirthdays = spec.template === "aniversariantes";

  const fillProgram = (range: "week" | "next" | "month") => {
    const now = new Date();
    const today = parts(now);
    const dayMs = 86_400_000;
    let start = now.getTime() - 6 * 3600_000;
    let end: number;
    if (range === "week") end = now.getTime() + 7 * dayMs;
    else if (range === "next") {
      // próxima segunda a domingo
      const toMonday = ((8 - today.weekday) % 7 || 7) * dayMs;
      start = now.getTime() + toMonday - (today.hour * 3600_000 + today.minute * 60_000);
      end = start + 7 * dayMs;
    } else {
      const next = today.m === 12 ? Date.UTC(today.y + 1, 0, 1, 3) : Date.UTC(today.y, today.m, 1, 3);
      end = next;
    }
    const list = events
      .filter((e) => e.is_published)
      .map((e) => ({ e, t: new Date(e.event_date).getTime(), p: parts(new Date(e.event_date)) }))
      .filter((x) => x.t >= start && x.t < end)
      .sort((a, b) => a.t - b.t)
      .slice(0, 12);
    if (!list.length) {
      toast.error("Nenhum evento publicado nesse período");
      return;
    }
    const first = list[0].p;
    const last = list[list.length - 1].p;
    set({
      tag: range === "month" ? "PROGRAMAÇÃO DO MÊS" : "PROGRAMAÇÃO DA SEMANA",
      title: range === "month" ? MONTHS[today.m - 1] : first.key === last.key ? shortDate(first) : `${shortDate(first)} a ${shortDate(last)}`,
      items: list.map(({ e, p }) => ({
        label: range === "month" ? `${String(p.d).padStart(2, "0")}/${String(p.m).padStart(2, "0")}` : `${WEEKDAYS[p.weekday]} ${p.d}`,
        title: e.title.slice(0, 80),
        detail: hourLabel(p.hour, p.minute),
      })),
    });
  };

  const fillBirthdays = async (month: number) => {
    setLoading(true);
    try {
      const rows = await api<{ day: number; name: string }[]>(`/api/admin/art/birthdays?month=${month}`);
      if (!rows.length) toast.info("Ninguém do cadastro de membros faz aniversário nesse mês");
      set({ title: MONTHS[month - 1], items: rows.slice(0, 12).map((r) => ({ label: `Dia ${String(r.day).padStart(2, "0")}`, title: r.name, detail: "" })) });
      if (rows.length > 12) toast.info(`São ${rows.length} aniversariantes: a arte mostra os 12 primeiros. Faça um carrossel para os demais.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível buscar os aniversariantes");
    } finally {
      setLoading(false);
    }
  };

  const currentMonth = parts(new Date()).m;
  return (
    <div className="space-y-3">
      {isBirthdays ? (
        <div className="space-y-1.5">
          <Label>Puxar do cadastro de membros</Label>
          <Select onValueChange={(v) => fillBirthdays(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha o mês" />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2].map((k) => {
                const m = ((currentMonth - 1 + k) % 12) + 1;
                return (
                  <SelectItem key={m} value={String(m)}>
                    {MONTHS[m - 1]}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label>Puxar da programação</Label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => fillProgram("week")}>
              Próximos 7 dias
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => fillProgram("next")}>
              Semana que vem
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => fillProgram("month")}>
              Este mês
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        <Label>{isBirthdays ? "Aniversariantes" : "Linhas da programação"}</Label>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        {items.map((it, i) => (
          <div key={i} className="flex gap-1.5">
            <Input className="w-20 px-2 text-sm" value={it.label} onChange={(e) => update(i, { label: e.target.value })} placeholder={isBirthdays ? "Dia 05" : "DOM 26"} aria-label="Dia" />
            <Input className="flex-1 text-sm" value={it.title} onChange={(e) => update(i, { title: e.target.value })} placeholder={isBirthdays ? "Nome" : "Culto"} aria-label="Nome" />
            {!isBirthdays && <Input className="w-16 px-2 text-sm" value={it.detail} onChange={(e) => update(i, { detail: e.target.value })} placeholder="19h" aria-label="Horário" />}
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => set({ items: items.filter((_, j) => j !== i) })} aria-label="Tirar linha">
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {items.length < 12 && (
          <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => set({ items: [...items, { label: "", title: "", detail: "" }] })}>
            <Plus className="w-4 h-4" /> Adicionar linha
          </Button>
        )}
      </div>
    </div>
  );
}
