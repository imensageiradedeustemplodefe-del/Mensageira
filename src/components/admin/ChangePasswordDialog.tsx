"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";

/** Qualquer pessoa da equipe troca a própria senha. */
export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const close = (o: boolean) => {
    if (!o) {
      setCurrent("");
      setPassword("");
      setConfirmation("");
    }
    onOpenChange(o);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmation) {
      toast({ title: "As senhas novas não são iguais", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api("/api/admin/me/password", { method: "POST", json: { current, password } });
      toast({ title: "Senha trocada" });
      close(false);
    } catch (err) {
      toast({ title: "Não foi possível trocar", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Trocar minha senha</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div>
            <Label htmlFor="pw-current">Senha atual</Label>
            <Input id="pw-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
          </div>
          <div>
            <Label htmlFor="pw-new">Nova senha</Label>
            <Input
              id="pw-new"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Pelo menos 8 caracteres"
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="pw-confirm">Repita a nova senha</Label>
            <Input id="pw-confirm" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required autoComplete="new-password" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
