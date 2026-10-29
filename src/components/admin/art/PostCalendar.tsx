"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Plus, RotateCcw, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/fetcher";
import { POST_KINDS, POST_STATUS, type PostKind, type PostStatus } from "@/lib/social-posts";
import { cn } from "@/lib/utils";
import type { Publication } from "@/components/admin/art/PublishDialog";
import { PUBLICATION_KIND, PUBLICATION_STATUS } from "@/components/admin/art/PublicationsList";

interface Post {
  id: string;
  date: string;
  title: string;
  kind: PostKind;
  status: PostStatus;
  responsible: string | null;
  notes: string | null;
}
type Draft = Omit<Post, "id"> & { id: string | null };

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const STATUS_STYLE: Record<PostStatus, string> = {
  planejado: "bg-muted text-foreground border-border",
  producao: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200",
  pronto: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-500/20 dark:text-sky-200",
  postado: "bg-green-100 text-green-900 border-green-300 dark:bg-green-500/20 dark:text-green-200",
};

const tz = { timeZone: "America/Sao_Paulo" } as const;
const todayKey = () => new Date().toLocaleDateString("en-CA", tz);
/** dia (aaaa-mm-dd) e hora (14:00) de Brasília de uma publicação */
const pubDay = (p: Publication) => new Date(p.published_at ?? p.publish_at).toLocaleDateString("en-CA", tz);
const pubTime = (p: Publication) => new Date(p.published_at ?? p.publish_at).toLocaleTimeString("pt-BR", { ...tz, hour: "2-digit", minute: "2-digit" });
const netNames = (p: Publication) => p.networks.map((n) => (n === "facebook" ? "Facebook" : "Instagram")).join(" e ");

/** Calendário de posts: o que vai ser postado em cada dia, quem cuida e em que pé está, junto com as
 * publicações feitas pelo site (agendadas, publicadas ou com erro). */
export function PostCalendar() {
  const [cursor, setCursor] = useState(() => {
    const [y, m] = todayKey().split("-").map(Number);
    return { y, m };
  });
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [openPub, setOpenPub] = useState<Publication | null>(null);
  const monthKey = `${cursor.y}-${String(cursor.m).padStart(2, "0")}`;

  const load = useCallback(() => {
    api<Post[]>(`/api/admin/art/posts?month=${monthKey}`)
      .then((rows) => setPosts(rows.map((r) => ({ ...r, date: r.date.slice(0, 10) }))))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erro ao carregar o calendário"));
    api<{ items: Publication[] }>(`/api/admin/art/publish?month=${monthKey}`)
      .then((r) => setPubs(r.items))
      .catch(() => setPubs([]));
  }, [monthKey]);
  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts ?? []) map.set(p.date, [...(map.get(p.date) ?? []), p]);
    return map;
  }, [posts]);
  const pubsByDay = useMemo(() => {
    const map = new Map<string, Publication[]>();
    for (const p of pubs) map.set(pubDay(p), [...(map.get(pubDay(p)) ?? []), p]);
    return map;
  }, [pubs]);

  // grade do mês começando no domingo
  const cells = useMemo(() => {
    const first = new Date(Date.UTC(cursor.y, cursor.m - 1, 1));
    const startOffset = first.getUTCDay();
    const days = new Date(Date.UTC(cursor.y, cursor.m, 0)).getUTCDate();
    const total = Math.ceil((startOffset + days) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(Date.UTC(cursor.y, cursor.m - 1, 1 - startOffset + i));
      return { key: d.toISOString().slice(0, 10), day: d.getUTCDate(), inMonth: d.getUTCMonth() === cursor.m - 1 };
    });
  }, [cursor]);

  const shift = (d: number) => setCursor((c) => (c.m + d < 1 ? { y: c.y - 1, m: 12 } : c.m + d > 12 ? { y: c.y + 1, m: 1 } : { y: c.y, m: c.m + d }));
  const openNew = (date: string) => setDraft({ id: null, date, title: "", kind: "feed", status: "planejado", responsible: "", notes: "" });

  const save = async () => {
    if (!draft || draft.title.trim().length < 2) return;
    setSaving(true);
    try {
      const body = { date: draft.date, title: draft.title, kind: draft.kind, status: draft.status, responsible: draft.responsible || null, notes: draft.notes || null };
      if (draft.id) await api(`/api/admin/art/posts/${draft.id}`, { method: "PATCH", json: body });
      else await api("/api/admin/art/posts", { method: "POST", json: body });
      setDraft(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!draft?.id || !confirm("Excluir este post do calendário?")) return;
    try {
      await api(`/api/admin/art/posts/${draft.id}`, { method: "DELETE" });
      setDraft(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível excluir");
    }
  };
  const setStatus = async (p: Post, status: PostStatus) => {
    setPosts((list) => list?.map((x) => (x.id === p.id ? { ...x, status } : x)) ?? null);
    await api(`/api/admin/art/posts/${p.id}`, { method: "PATCH", json: { status } }).catch(() => load());
  };

  const today = todayKey();
  const chip = (p: Post) => (
    <button
      key={p.id}
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setDraft({ ...p, responsible: p.responsible ?? "", notes: p.notes ?? "" });
      }}
      className={cn("w-full text-left rounded border px-1.5 py-0.5 text-[11px] leading-tight truncate min-h-0 min-w-0 block", STATUS_STYLE[p.status])}
      title={`${p.title} · ${POST_KINDS[p.kind]} · ${POST_STATUS[p.status]}${p.responsible ? ` · ${p.responsible}` : ""}`}
    >
      <span className="font-semibold">{POST_KINDS[p.kind]}</span> {p.title}
    </button>
  );
  const pubChip = (p: Publication) => {
    const st = PUBLICATION_STATUS[p.status] ?? PUBLICATION_STATUS.erro;
    return (
      <button
        key={p.id}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpenPub(p);
        }}
        className={cn("w-full text-left rounded px-1.5 py-0.5 text-[11px] leading-tight truncate min-h-0 min-w-0 flex items-center gap-1", st.className)}
        title={`${p.title} · ${pubTime(p)} · ${st.label} · ${netNames(p)}`}
      >
        <Send className="w-3 h-3 shrink-0" />
        <span className="font-semibold">{pubTime(p)}</span>
        <span className="truncate">{p.title}</span>
      </button>
    );
  };
  const removePub = async (p: Publication) => {
    const msg = p.status === "agendado" ? `Cancelar o agendamento de "${p.title}"?` : `Tirar "${p.title}" da lista? (o que já foi publicado continua nas redes)`;
    if (!confirm(msg)) return;
    try {
      await api(`/api/admin/art/publish/${p.id}`, { method: "DELETE" });
      setPubs((l) => l.filter((x) => x.id !== p.id));
      setOpenPub(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover");
    }
  };
  const [retrying, setRetrying] = useState(false);
  const retryPub = async (p: Publication) => {
    setRetrying(true);
    try {
      const row = await api<Publication>(`/api/admin/art/publish/${p.id}`, { method: "POST" });
      setPubs((l) => l.map((x) => (x.id === row.id ? row : x)));
      setOpenPub(row);
      if (row.status === "publicado") toast.success("Publicado!");
      else toast.error(row.result ?? "Ainda não deu certo", { duration: 12000 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível tentar de novo");
    } finally {
      setRetrying(false);
    }
  };
  const monthPosts = (posts ?? []).filter((p) => p.date.startsWith(monthKey));
  // celular: posts planejados e publicações do mês, em ordem de dia
  const monthItems = [
    ...monthPosts.map((p) => ({ day: p.date, post: p, pub: null as Publication | null })),
    ...pubs.filter((p) => pubDay(p).startsWith(monthKey)).map((p) => ({ day: pubDay(p), post: null as Post | null, pub: p })),
  ].sort((a, b) => a.day.localeCompare(b.day) || (a.pub ? pubTime(a.pub) : "").localeCompare(b.pub ? pubTime(b.pub) : ""));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Mês anterior">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold text-lg w-40 text-center">
          {MONTHS[cursor.m - 1]} {cursor.y}
        </h3>
        <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Próximo mês">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button className="ml-auto gap-2" onClick={() => openNew(today.startsWith(monthKey) ? today : `${monthKey}-01`)}>
          <Plus className="w-4 h-4" /> Novo post
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {(Object.keys(POST_STATUS) as PostStatus[]).map((s) => (
          <span key={s} className={cn("rounded border px-2 py-0.5", STATUS_STYLE[s])}>
            {POST_STATUS[s]}
          </span>
        ))}
        <span className="text-muted-foreground">Publicações:</span>
        {(["agendado", "publicado", "erro"] as const).map((k) => (
          <span key={k} className={cn("rounded px-2 py-0.5 inline-flex items-center gap-1", PUBLICATION_STATUS[k].className)}>
            <Send className="w-3 h-3" /> {PUBLICATION_STATUS[k].label}
          </span>
        ))}
        <span className="text-muted-foreground basis-full">Toque num dia vazio para planejar um post. A equipe recebe um lembrete às 7h no dia.</span>
      </div>

      {!posts ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* computador: grade do mês */}
          <div className="hidden md:grid grid-cols-7 gap-px rounded-lg border bg-border overflow-hidden">
            {WEEK.map((w) => (
              <div key={w} className="bg-muted/60 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {w}
              </div>
            ))}
            {cells.map((c) => (
              <div
                key={c.key}
                onClick={() => openNew(c.key)}
                className={cn("bg-background min-h-24 p-1.5 space-y-1 cursor-pointer hover:bg-accent/40", !c.inMonth && "bg-muted/30 text-muted-foreground")}
              >
                <div className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full", c.key === today && "bg-primary text-primary-foreground")}>{c.day}</div>
                {(pubsByDay.get(c.key) ?? []).map(pubChip)}
                {(byDay.get(c.key) ?? []).map(chip)}
              </div>
            ))}
          </div>

          {/* celular: lista do mês */}
          <div className="md:hidden space-y-2">
            {monthItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum post neste mês.</p>}
            {monthItems.map(({ day, post: p, pub }) =>
              pub ? (
                <Card key={pub.id} onClick={() => setOpenPub(pub)} className="cursor-pointer">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="text-center w-11 shrink-0">
                      <div className="text-lg font-bold leading-none">{Number(day.slice(8))}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{WEEK[new Date(`${day}T12:00:00Z`).getUTCDay()]}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{pub.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {pubTime(pub)} · {PUBLICATION_KIND[pub.kind] ?? pub.kind} · {netNames(pub)}
                      </p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium inline-flex items-center gap-1", (PUBLICATION_STATUS[pub.status] ?? PUBLICATION_STATUS.erro).className)}>
                      <Send className="w-3 h-3" /> {(PUBLICATION_STATUS[pub.status] ?? PUBLICATION_STATUS.erro).label}
                    </span>
                  </CardContent>
                </Card>
              ) : (
                p && (
                  <Card key={p.id} onClick={() => setDraft({ ...p, responsible: p.responsible ?? "", notes: p.notes ?? "" })} className="cursor-pointer">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="text-center w-11 shrink-0">
                        <div className="text-lg font-bold leading-none">{Number(p.date.slice(8))}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{WEEK[new Date(`${p.date}T12:00:00Z`).getUTCDay()]}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {POST_KINDS[p.kind]}
                          {p.responsible ? ` · ${p.responsible}` : ""}
                        </p>
                      </div>
                      <span onClick={(e) => e.stopPropagation()}>
                        <Select value={p.status} onValueChange={(v) => setStatus(p, v as PostStatus)}>
                          <SelectTrigger className={cn("h-8 w-32 text-xs", STATUS_STYLE[p.status])}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(POST_STATUS) as PostStatus[]).map((s) => (
                              <SelectItem key={s} value={s}>
                                {POST_STATUS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </span>
                    </CardContent>
                  </Card>
                )
              ),
            )}
          </div>
        </>
      )}

      <Dialog open={!!openPub} onOpenChange={(o) => !o && setOpenPub(null)}>
        <DialogContent className="max-w-md">
          {openPub && (
            <>
              <DialogHeader>
                <DialogTitle>{openPub.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex gap-2 overflow-x-auto">
                  {openPub.images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" className="h-40 rounded-md border bg-muted object-contain" />
                  ))}
                </div>
                <p className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", (PUBLICATION_STATUS[openPub.status] ?? PUBLICATION_STATUS.erro).className)}>
                    {(PUBLICATION_STATUS[openPub.status] ?? PUBLICATION_STATUS.erro).label}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(openPub.published_at ?? openPub.publish_at).toLocaleString("pt-BR", { ...tz, weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} ·{" "}
                    {PUBLICATION_KIND[openPub.kind] ?? openPub.kind} · {netNames(openPub)}
                    {openPub.created_by ? ` · ${openPub.created_by}` : ""}
                  </span>
                </p>
                {openPub.result && <p className="text-xs text-muted-foreground break-words">{openPub.result}</p>}
                {openPub.caption && <p className="whitespace-pre-line rounded-md bg-muted p-2 text-xs max-h-40 overflow-y-auto">{openPub.caption}</p>}
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                {openPub.status !== "publicando" ? (
                  <Button variant="ghost" className="text-destructive hover:text-destructive gap-1" onClick={() => removePub(openPub)}>
                    <Trash2 className="w-4 h-4" /> {openPub.status === "agendado" ? "Cancelar agendamento" : "Tirar da lista"}
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  {(openPub.status === "erro" || openPub.status === "parcial") && (
                    <Button variant="outline" disabled={retrying} onClick={() => retryPub(openPub)} className="gap-1">
                      {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Tentar de novo
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setOpenPub(null)}>
                    Fechar
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar post" : "Planejar post"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="post-title">O que vai ser postado</Label>
                <Input id="post-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ex.: Arte do Culto da Família" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="post-date">Dia</Label>
                  <Input id="post-date" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v as PostKind })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(POST_KINDS) as PostKind[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {POST_KINDS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Situação</Label>
                  <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as PostStatus })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(POST_STATUS) as PostStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {POST_STATUS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="post-resp">Responsável</Label>
                  <Input id="post-resp" value={draft.responsible ?? ""} onChange={(e) => setDraft({ ...draft, responsible: e.target.value })} placeholder="Ex.: Jessica" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-notes">Observações</Label>
                <Textarea id="post-notes" rows={3} value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Ideias, texto, fotos que vão ser usadas…" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            {draft?.id ? (
              <Button variant="ghost" className="text-destructive hover:text-destructive gap-1" onClick={remove}>
                <Trash2 className="w-4 h-4" /> Excluir
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDraft(null)}>
                Cancelar
              </Button>
              <Button onClick={save} disabled={saving || !draft || draft.title.trim().length < 2} className="gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
