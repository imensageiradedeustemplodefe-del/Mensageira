"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/fetcher";
import type { ArtSpec } from "@/lib/art/spec";
import type { Network } from "@/lib/social-publish";

export interface Publication {
  id: string;
  title: string;
  kind: string;
  images: string[];
  caption: string;
  networks: Network[];
  publish_at: string;
  status: string;
  result: string | null;
  published_at: string | null;
  created_by: string | null;
}

const tz = { timeZone: "America/Sao_Paulo" } as const;
const today = () => new Date().toLocaleDateString("en-CA", tz);

/**
 * Formulário de publicar: Facebook e/ou Instagram, agora ou agendado. Com `editCaption`, mostra a
 * legenda para editar (na janela); sem, publica a legenda recebida (a etapa 3 do Criar arte já tem a caixa).
 */
export function PublishForm({
  title,
  specs,
  caption: initialCaption,
  editCaption = false,
  onDone,
  onCancel,
}: {
  title: string;
  specs: ArtSpec[];
  caption: string;
  editCaption?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const story = specs.length === 1 && specs[0].format === "story";
  const [ownCaption, setCaption] = useState(initialCaption);
  const caption = editCaption ? ownCaption : initialCaption;
  const [networks, setNetworks] = useState<Network[]>(["facebook", "instagram"]);
  const [when, setWhen] = useState<"agora" | "agendar">("agora");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("19:00");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api<{ configured: boolean }>("/api/admin/art/publish")
      .then((r) => setConfigured(r.configured))
      .catch(() => setConfigured(false));
  }, []);

  const toggle = (n: Network, on: boolean) => setNetworks((l) => (on ? [...new Set([...l, n])] : l.filter((x) => x !== n)));

  const submit = async () => {
    setSending(true);
    try {
      // horário de Brasília (sem horário de verão desde 2019)
      const publish_at = when === "agendar" ? `${date}T${time}:00-03:00` : null;
      const row = await api<Publication>("/api/admin/art/publish", { method: "POST", json: { title, specs, caption: story ? "" : caption, networks, publish_at } });
      if (row.status === "agendado") {
        toast.success(`Agendado para ${new Date(row.publish_at).toLocaleString("pt-BR", { ...tz, dateStyle: "short", timeStyle: "short" })}. Acompanhe na aba Publicações.`);
      } else if (row.status === "publicado") {
        toast.success("Publicado! " + (row.result ?? ""));
      } else {
        toast.error(row.result ?? "Não foi possível publicar", { duration: 12000 });
      }
      onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível publicar");
    } finally {
      setSending(false);
    }
  };

  const nowBlocked = when === "agora" && configured === false;
  return (
    <div className="space-y-4">
      {configured === false && (
        <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            A conexão com o Facebook e o Instagram ainda não foi configurada pelo administrador. Dá para deixar agendado: sai sozinho quando a conexão
            estiver pronta e o horário chegar.
          </span>
        </div>
      )}
      <div className="space-y-2">
        <Label>Onde publicar</Label>
        <div className="flex gap-4">
          {(["facebook", "instagram"] as const).map((n) => (
            <label key={n} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={networks.includes(n)} onCheckedChange={(v) => toggle(n, v === true)} />
              {n === "facebook" ? "Facebook" : "Instagram"}
            </label>
          ))}
        </div>
      </div>
      {story ? (
        <p className="text-xs text-muted-foreground">Story não tem legenda: vai só a imagem.</p>
      ) : (
        editCaption && (
          <div className="space-y-1.5">
            <Label htmlFor="pub-caption">Legenda</Label>
            <Textarea id="pub-caption" rows={6} value={ownCaption} onChange={(e) => setCaption(e.target.value)} maxLength={2200} className="text-sm" />
          </div>
        )
      )}
      <div className="space-y-2">
        <Label>Quando</Label>
        <RadioGroup value={when} onValueChange={(v) => setWhen(v as "agora" | "agendar")} className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <RadioGroupItem value="agora" /> Agora
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <RadioGroupItem value="agendar" /> Agendar
          </label>
        </RadioGroup>
        {when === "agendar" && (
          <div className="grid grid-cols-[1fr_7rem] gap-2">
            <Input type="date" aria-label="Data" value={date} min={today()} onChange={(e) => setDate(e.target.value)} />
            <Input type="time" aria-label="Horário" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        )}
        {when === "agendar" && <p className="text-xs text-muted-foreground">Sai sozinho no horário (pode atrasar alguns minutos). Dá para cancelar na aba Publicações.</p>}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button onClick={submit} disabled={sending || networks.length === 0 || nowBlocked || (when === "agendar" && (!date || !time))} className="gap-2">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {when === "agora" ? "Publicar agora" : "Agendar publicação"}
        </Button>
      </div>
    </div>
  );
}

/** Janela "Publicar nas redes" (usada no Carrossel). O pai remonta a cada abertura (key). */
export function PublishDialog({
  open,
  onOpenChange,
  title,
  specs,
  caption,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  specs: ArtSpec[];
  caption: string;
}) {
  const story = specs.length === 1 && specs[0].format === "story";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publicar nas redes</DialogTitle>
          <DialogDescription>
            {specs.length > 1 ? `Carrossel com ${specs.length} imagens` : story ? "Story" : "Post no feed"} · {title}
          </DialogDescription>
        </DialogHeader>
        <PublishForm title={title} specs={specs} caption={caption} editCaption onDone={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
