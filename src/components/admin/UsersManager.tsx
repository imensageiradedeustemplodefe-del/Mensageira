"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, STAFF_ROLES, type StaffRole } from "@/lib/roles";

interface UserRow {
  id: string;
  username: string;
  name: string | null;
  role: StaffRole;
}

type Form = { id: string | null; username: string; name: string; role: StaffRole; password: string };

/** Usuários do painel e o papel de cada um (só o administrador vê esta aba). */
export function UsersManager({ currentUserId }: { currentUserId?: string }) {
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () =>
    api<UserRow[]>("/api/admin/users")
      .then(setRows)
      .catch((err) => toast({ title: "Erro ao carregar usuários", description: String(err.message ?? err), variant: "destructive" }));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const body = {
        username: form.username.trim().toLowerCase(),
        name: form.name.trim(),
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      };
      if (form.id) await api(`/api/admin/users/${form.id}`, { method: "PATCH", json: body });
      else await api("/api/admin/users", { method: "POST", json: body });
      toast({ title: form.id ? "Usuário atualizado" : "Usuário criado", description: form.id ? undefined : `Entra com o usuário "${body.username}".` });
      setForm(null);
      load();
    } catch (err) {
      toast({ title: "Não foi possível salvar", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u: UserRow) => {
    if (!confirm(`Excluir o usuário "${u.username}"? A pessoa perde o acesso ao painel em poucos minutos.`)) return;
    try {
      await api(`/api/admin/users/${u.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      toast({ title: "Não foi possível excluir", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground space-y-0.5">
          {STAFF_ROLES.map((r) => (
            <p key={r}>
              <span className="font-medium text-foreground">{ROLE_LABELS[r]}:</span> {ROLE_DESCRIPTIONS[r]}
            </p>
          ))}
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setForm({ id: null, username: "", name: "", role: "midia", password: "" })}>
          <Plus className="w-4 h-4" /> Novo usuário
        </Button>
      </div>

      {!rows ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-2">
          {rows.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <UserCog className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold truncate">{u.name || u.username}</span>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>{ROLE_LABELS[u.role]}</Badge>
                    {u.id === currentUserId && <span className="text-xs text-muted-foreground">(você)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">usuário: {u.username}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar"
                    title="Editar"
                    onClick={() => setForm({ id: u.id, username: u.username, name: u.name ?? "", role: u.role, password: "" })}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {u.id !== currentUserId && (
                    <Button variant="ghost" size="icon" aria-label="Excluir" title="Excluir" className="text-destructive hover:text-destructive" onClick={() => remove(u)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar usuário" : "Novo usuário"}</DialogTitle>
            <DialogDescription>
              {form?.id ? "Deixe a senha em branco para manter a atual." : "Passe o usuário e a senha para a pessoa; ela pode trocar a senha depois."}
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="u-name">Nome</Label>
                <Input id="u-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: Maria Souza" />
              </div>
              <div>
                <Label htmlFor="u-username">Usuário (para entrar)</Label>
                <Input
                  id="u-username"
                  value={form.username}
                  onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
                  placeholder="Ex.: maria"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <p className="text-xs text-muted-foreground mt-1">Letras minúsculas, números, ponto, hífen ou sublinhado.</p>
              </div>
              <div>
                <Label>Acesso</Label>
                <Select value={form.role} onValueChange={(v) => set("role", v as StaffRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">{ROLE_DESCRIPTIONS[form.role]}</p>
              </div>
              <div>
                <Label htmlFor="u-password">{form.id ? "Nova senha (opcional)" : "Senha"}</Label>
                <Input
                  id="u-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Pelo menos 8 caracteres"
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
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
