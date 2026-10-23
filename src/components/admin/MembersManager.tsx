"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, IdCard, Loader2, Users, HardHat, Camera, X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface MemberRow {
  id: string;
  number: number;
  name: string;
  gender: "M" | "F" | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  baptism_date: string | null;
  member_since: string | null;
  role: string;
  groups: string[];
  worker: boolean;
  status: string;
  photo?: string | null;
  notes: string | null;
}

export const ROLES = ["Membro", "Congregado", "Cooperador(a)", "Diácono / Diaconisa", "Presbítero", "Evangelista", "Missionário(a)", "Pastor(a)"];
const SUGGESTED_GROUPS = ["Louvor", "Jovens", "Adolescentes", "Crianças", "Senhoras", "Varões", "Intercessão", "Recepção", "Mídia", "Escola Bíblica", "Limpeza"];
const STATUS: Record<string, string> = { ativo: "Ativo", inativo: "Inativo", transferido: "Transferido", falecido: "Falecido" };

type Form = Omit<MemberRow, "id" | "number">;
const EMPTY: Form = {
  name: "",
  gender: null,
  birth_date: null,
  phone: null,
  email: null,
  address: null,
  bairro: null,
  cidade: null,
  uf: null,
  baptism_date: null,
  member_since: null,
  role: "Membro",
  groups: [],
  worker: false,
  status: "ativo",
  photo: null,
  notes: null,
};

const day = (v: string | null) => (v ? v.slice(0, 10) : "");

/** Reduz a foto para 300x400 (3x4) em JPEG, para guardar no cadastro sem pesar. */
function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const W = 300;
      const H = 400;
      const scale = Math.max(W / img.width, H / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      canvas.getContext("2d")!.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => reject(new Error("Não foi possível abrir a foto"));
    img.src = URL.createObjectURL(file);
  });
}

function countBy(list: string[]) {
  const m = new Map<string, number>();
  list.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export function MembersManager() {
  const [rows, setRows] = useState<MemberRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ativo");
  const [role, setRole] = useState("todos");
  const [group, setGroup] = useState<string | null>(null);
  const [onlyWorkers, setOnlyWorkers] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);
  const [saving, setSaving] = useState(false);
  const [groupDraft, setGroupDraft] = useState("");
  const { toast } = useToast();

  const load = () =>
    api<MemberRow[]>("/api/admin/members")
      .then(setRows)
      .catch((err) => toast({ title: "Erro ao carregar membros", description: String(err.message ?? err), variant: "destructive" }));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = useMemo(() => (rows ?? []).filter((m) => m.status === "ativo"), [rows]);
  const byRole = useMemo(() => countBy(active.map((m) => m.role)), [active]);
  const byGroup = useMemo(() => countBy(active.flatMap((m) => m.groups)), [active]);
  const allGroups = useMemo(() => [...new Set([...SUGGESTED_GROUPS, ...(rows ?? []).flatMap((m) => m.groups)])], [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? []).filter(
      (m) =>
        (status === "todos" || m.status === status) &&
        (role === "todos" || m.role === role) &&
        (!group || m.groups.includes(group)) &&
        (!onlyWorkers || m.worker) &&
        (!q || m.name.toLowerCase().includes(q) || String(m.number).includes(q) || (m.phone ?? "").includes(q)),
    );
  }, [rows, search, status, role, group, onlyWorkers]);

  const openNew = () => setEditing({ id: null, form: { ...EMPTY } });
  const openEdit = async (m: MemberRow) => {
    // foto fica indefinida até carregar: se não carregar, o PATCH não mexe nela
    setEditing({ id: m.id, form: { ...EMPTY, ...m, photo: undefined } });
    try {
      // a lista vem sem foto: busca o cadastro completo
      const full = await api<MemberRow>(`/api/admin/members/${m.id}`);
      setEditing((e) => (e && e.id === m.id ? { ...e, form: { ...e.form, photo: full.photo ?? null } } : e));
    } catch {
      /* segue sem a foto */
    }
  };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  const save = async () => {
    if (!editing) return;
    const f = editing.form;
    if (f.name.trim().length < 2) {
      toast({ title: "Informe o nome", variant: "destructive" });
      return;
    }
    const body = {
      ...f,
      birth_date: day(f.birth_date) || null,
      baptism_date: day(f.baptism_date) || null,
      member_since: day(f.member_since) || null,
      uf: f.uf ? f.uf.toUpperCase() : null,
    };
    setSaving(true);
    try {
      if (editing.id) await api(`/api/admin/members/${editing.id}`, { method: "PATCH", json: body });
      else await api("/api/admin/members", { method: "POST", json: body });
      toast({ title: editing.id ? "Cadastro atualizado" : "Membro cadastrado" });
      setEditing(null);
      load();
    } catch (err) {
      toast({ title: "Não foi possível salvar", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m: MemberRow) => {
    if (!confirm(`Excluir o cadastro de ${m.name}? Se a pessoa saiu da igreja, prefira mudar a situação para "Inativo" ou "Transferido".`)) return;
    try {
      await api(`/api/admin/members/${m.id}`, { method: "DELETE" });
      setSelected((s) => {
        const n = new Set(s);
        n.delete(m.id);
        return n;
      });
      load();
    } catch (err) {
      toast({ title: "Não foi possível excluir", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  };

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const printCards = (ids: string[]) => window.open(`/admin/secretaria/carteirinhas?ids=${ids.join(",")}`, "_blank");

  const addGroup = (g: string) => {
    const v = g.trim();
    if (!editing || !v || editing.form.groups.includes(v)) return;
    set("groups", [...editing.form.groups, v]);
    setGroupDraft("");
  };

  if (!rows) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Números */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" /> Membros ativos
            </div>
            <div className="text-3xl font-bold">{active.length}</div>
            <div className="text-xs text-muted-foreground">{rows.length} cadastros no total</div>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-colors", onlyWorkers && "border-primary")} onClick={() => setOnlyWorkers((v) => !v)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HardHat className="w-4 h-4" /> Trabalham na obra
            </div>
            <div className="text-3xl font-bold">{active.filter((m) => m.worker).length}</div>
            <div className="text-xs text-muted-foreground">toque para filtrar</div>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-2">Por cargo (ativos)</div>
            <div className="flex flex-wrap gap-1.5">
              {byRole.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
              {byRole.map(([r, n]) => (
                <Badge
                  key={r}
                  variant={role === r ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setRole(role === r ? "todos" : r)}
                >
                  {r}: {n}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {byGroup.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-2">Por grupo (ativos)</div>
            <div className="flex flex-wrap gap-1.5">
              {byGroup.map(([g, n]) => (
                <Badge key={g} variant={group === g ? "default" : "outline"} className="cursor-pointer" onClick={() => setGroup(group === g ? null : g)}>
                  {g}: {n}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros e ações */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, matrícula ou telefone" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="md:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as situações</SelectItem>
            {Object.entries(STATUS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}s
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Novo membro
        </Button>
      </div>

      {(group || role !== "todos" || onlyWorkers) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtros:</span>
          {role !== "todos" && <Badge variant="secondary">{role}</Badge>}
          {group && <Badge variant="secondary">{group}</Badge>}
          {onlyWorkers && <Badge variant="secondary">Trabalham na obra</Badge>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRole("todos");
              setGroup(null);
              setOnlyWorkers(false);
            }}
          >
            Limpar
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "pessoa" : "pessoas"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((m) => m.id)))}
            disabled={filtered.length === 0}
          >
            {selected.size === filtered.length && filtered.length > 0 ? "Desmarcar todos" : "Marcar todos"}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" disabled={selected.size === 0} onClick={() => printCards([...selected])}>
            <Printer className="w-4 h-4" /> Carteirinhas ({selected.size})
          </Button>
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {rows.length === 0 ? "Nenhum membro cadastrado ainda. Toque em \"Novo membro\" para começar." : "Ninguém encontrado com esses filtros."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((m) => (
            <Card key={m.id} className={cn(selected.has(m.id) && "border-primary")}>
              <CardContent className="p-3 flex items-center gap-3">
                <Checkbox checked={selected.has(m.id)} onCheckedChange={() => toggle(m.id)} aria-label={`Selecionar ${m.name}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold truncate">{m.name}</span>
                    <span className="text-xs text-muted-foreground">nº {String(m.number).padStart(4, "0")}</span>
                    {m.status !== "ativo" && <Badge variant="outline">{STATUS[m.status] ?? m.status}</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <span>{m.role}</span>
                    {m.worker && (
                      <Badge variant="secondary" className="gap-1">
                        <HardHat className="w-3 h-3" /> Obreiro(a)
                      </Badge>
                    )}
                    {m.groups.map((g) => (
                      <Badge key={g} variant="outline">
                        {g}
                      </Badge>
                    ))}
                    {m.phone && <span>· {m.phone}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => printCards([m.id])} aria-label="Carteirinha" title="Carteirinha">
                    <IdCard className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(m)} aria-label="Editar" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(m)} aria-label="Excluir" title="Excluir" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulário */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar membro" : "Novo membro"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="relative w-24 h-32 shrink-0 rounded-md border bg-muted flex items-center justify-center overflow-hidden cursor-pointer">
                  {editing.form.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editing.form.photo} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center text-xs text-muted-foreground gap-1">
                      <Camera className="w-5 h-5" /> Foto 3x4
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      try {
                        set("photo", await resizePhoto(file));
                      } catch (err) {
                        toast({ title: err instanceof Error ? err.message : "Foto inválida", variant: "destructive" });
                      }
                    }}
                  />
                  {editing.form.photo && (
                    <button
                      type="button"
                      className="absolute top-1 right-1 rounded-full bg-background/90 p-0.5"
                      aria-label="Remover foto"
                      onClick={(e) => {
                        e.preventDefault();
                        set("photo", null);
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </label>
                <div className="flex-1 grid gap-3">
                  <div>
                    <Label>Nome completo *</Label>
                    <Input value={editing.form.name} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Sexo</Label>
                      <Select value={editing.form.gender ?? ""} onValueChange={(v) => set("gender", v as "M" | "F")}>
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nascimento</Label>
                      <Input type="date" value={day(editing.form.birth_date)} onChange={(e) => set("birth_date", e.target.value || null)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Telefone / WhatsApp</Label>
                  <Input value={editing.form.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} inputMode="tel" />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input value={editing.form.email ?? ""} onChange={(e) => set("email", e.target.value || null)} type="email" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Endereço</Label>
                  <Input value={editing.form.address ?? ""} onChange={(e) => set("address", e.target.value || null)} placeholder="Rua, número" />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input value={editing.form.bairro ?? ""} onChange={(e) => set("bairro", e.target.value || null)} />
                </div>
                <div className="grid grid-cols-[1fr_5rem] gap-3">
                  <div>
                    <Label>Cidade</Label>
                    <Input value={editing.form.cidade ?? ""} onChange={(e) => set("cidade", e.target.value || null)} />
                  </div>
                  <div>
                    <Label>UF</Label>
                    <Input value={editing.form.uf ?? ""} maxLength={2} onChange={(e) => set("uf", e.target.value.toUpperCase() || null)} />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 border-t pt-4">
                <div>
                  <Label>Cargo</Label>
                  <Select
                    value={editing.form.role}
                    onValueChange={(v) => {
                      set("role", v);
                      if (v !== "Membro" && v !== "Congregado") set("worker", true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...new Set([...ROLES, editing.form.role])].map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Membro desde</Label>
                  <Input type="date" value={day(editing.form.member_since)} onChange={(e) => set("member_since", e.target.value || null)} />
                </div>
                <div>
                  <Label>Batismo</Label>
                  <Input type="date" value={day(editing.form.baptism_date)} onChange={(e) => set("baptism_date", e.target.value || null)} />
                </div>
                <div>
                  <Label>Situação</Label>
                  <Select value={editing.form.status} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="sm:col-span-2 flex items-center justify-between gap-3 rounded-md border p-3 self-end">
                  <span>
                    <span className="font-medium text-sm">Trabalha na obra</span>
                    <span className="block text-xs text-muted-foreground">Obreiro(a): serve em algum ministério ou função</span>
                  </span>
                  <Switch checked={editing.form.worker} onCheckedChange={(v) => set("worker", v)} />
                </label>
              </div>

              <div className="border-t pt-4">
                <Label>Grupos / ministérios</Label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {allGroups.map((g) => {
                    const on = editing.form.groups.includes(g);
                    return (
                      <Badge
                        key={g}
                        variant={on ? "default" : "outline"}
                        className="cursor-pointer select-none"
                        onClick={() => set("groups", on ? editing.form.groups.filter((x) => x !== g) : [...editing.form.groups, g])}
                      >
                        {g}
                      </Badge>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Outro grupo"
                    value={groupDraft}
                    onChange={(e) => setGroupDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addGroup(groupDraft);
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={() => addGroup(groupDraft)}>
                    Adicionar
                  </Button>
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea rows={2} value={editing.form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
