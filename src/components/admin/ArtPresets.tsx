"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, ImageIcon, Loader2, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/lib/fetcher";
import { ART_FORMATS, ART_TEMPLATES, type ArtSpec } from "@/lib/art/spec";
import { cn } from "@/lib/utils";

export interface Preset {
  id: string;
  name: string;
  spec: ArtSpec;
  thumb_url?: string | null;
  thumbUrl?: string | null;
}

const thumbOf = (p: Preset) => p.thumbUrl ?? p.thumb_url ?? null;

/** Reduz a arte (JPEG) para uma miniatura de 360px de largura e envia; devolve o endereço. */
export async function uploadThumb(blob: Blob): Promise<string> {
  const bmp = await createImageBitmap(blob);
  const w = 360;
  const h = Math.round((bmp.height * w) / bmp.width);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  const data = c.toDataURL("image/jpeg", 0.8);
  return (await api<{ url: string }>("/api/admin/images", { method: "POST", json: { data, width: w, height: h } })).url;
}

/** Gera a arte de um modelo no servidor (para fazer a miniatura dos modelos antigos). */
async function renderBlob(spec: ArtSpec) {
  const res = await fetch("/api/admin/art", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(spec) });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.blob();
}

/** Galeria dos modelos salvos: miniatura, nome e formato; abrir com um toque, renomear e excluir. */
export function PresetGallery({
  presets,
  activeId,
  onOpen,
  onNew,
  setPresets,
}: {
  presets: Preset[];
  activeId: string | null;
  onOpen: (p: Preset) => void;
  onNew: () => void;
  setPresets: React.Dispatch<React.SetStateAction<Preset[]>>;
}) {
  const [renaming, setRenaming] = useState<Preset | null>(null);
  const [newName, setNewName] = useState("");
  const making = useRef(new Set<string>());

  // modelos salvos antes das miniaturas: gera uma de cada vez, em segundo plano
  useEffect(() => {
    const missing = presets.filter((p) => !thumbOf(p) && !making.current.has(p.id));
    if (!missing.length) return;
    let alive = true;
    (async () => {
      for (const p of missing) {
        making.current.add(p.id);
        try {
          const url = await uploadThumb(await renderBlob(p.spec));
          const row = await api<Preset>(`/api/admin/art/presets/${p.id}`, { method: "PATCH", json: { thumb_url: url } });
          if (alive) setPresets((list) => list.map((x) => (x.id === row.id ? row : x)));
        } catch {
          /* fica sem miniatura */
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [presets, setPresets]);

  const remove = async (p: Preset) => {
    if (!confirm(`Excluir o modelo "${p.name}"?`)) return;
    try {
      await api(`/api/admin/art/presets/${p.id}`, { method: "DELETE" });
      setPresets((list) => list.filter((x) => x.id !== p.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível excluir");
    }
  };

  const rename = async () => {
    if (!renaming || newName.trim().length < 2) return;
    try {
      const row = await api<Preset>(`/api/admin/art/presets/${renaming.id}`, { method: "PATCH", json: { name: newName.trim() } });
      setPresets((list) => list.map((x) => (x.id === row.id ? row : x)).sort((a, b) => a.name.localeCompare(b.name)));
      setRenaming(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível renomear");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">Modelos salvos</h3>
        <span className="text-xs text-muted-foreground">Toque para abrir. Monte uma arte e use “Salvar como modelo” para criar outro.</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
        <button
          type="button"
          onClick={onNew}
          className={cn(
            "snap-start shrink-0 w-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground hover:border-primary hover:text-primary min-h-0",
            activeId === null && "border-primary text-primary",
          )}
          style={{ height: 196 }}
        >
          <Plus className="w-6 h-6" />
          Arte nova
        </button>
        {presets.map((p) => {
          const fmt = ART_FORMATS[p.spec.format] ?? ART_FORMATS.feed;
          const thumb = thumbOf(p);
          const active = activeId === p.id;
          return (
            <div key={p.id} className="snap-start shrink-0 w-32 relative group">
              <button
                type="button"
                onClick={() => onOpen(p)}
                className={cn("block w-full rounded-xl border-2 overflow-hidden bg-muted min-h-0", active ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-primary/50")}
                style={{ height: 150 }}
                title={`Abrir ${p.name}`}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="w-full h-full object-contain bg-muted" loading="lazy" />
                ) : (
                  <span className="flex w-full h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-6 h-6" />
                  </span>
                )}
                {active && (
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-primary text-primary-foreground p-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
              <div className="mt-1.5 flex items-start gap-1">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-tight line-clamp-2" title={p.name}>
                    {p.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {ART_TEMPLATES[p.spec.template]?.label ?? ""} · {fmt.label.split(" ")[0]}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="p-1 rounded hover:bg-muted min-h-0 min-w-0 text-muted-foreground" aria-label={`Opções do modelo ${p.name}`}>
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setRenaming(p);
                        setNewName(p.name);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" /> Renomear
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => remove(p)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Renomear modelo</DialogTitle>
          </DialogHeader>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && rename()} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>
              Cancelar
            </Button>
            <Button onClick={rename} disabled={newName.trim().length < 2}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Janela "Salvar como modelo": atualizar o modelo aberto ou criar um novo com nome. */
export function SavePresetDialog({
  open,
  onOpenChange,
  current,
  suggestedName,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  current: Preset | null;
  suggestedName: string;
  onSave: (mode: "update" | "new", name: string) => Promise<void>;
}) {
  // o pai remonta a janela a cada abertura (key), então o estado começa certo
  const [mode, setMode] = useState<"update" | "new">(current ? "update" : "new");
  const [name, setName] = useState(current ? "" : suggestedName);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (mode === "new" && name.trim().length < 2) return;
    setSaving(true);
    try {
      await onSave(mode, mode === "update" ? current!.name : name.trim());
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar como modelo</DialogTitle>
          <DialogDescription>O modelo guarda o formato, o fundo, as cores e os textos. Depois é só abrir e trocar o que mudar.</DialogDescription>
        </DialogHeader>
        {current && (
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as "update" | "new")} className="space-y-2">
            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer">
              <RadioGroupItem value="update" className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium">Atualizar “{current.name}”</span>
                <span className="block text-xs text-muted-foreground">Substitui o modelo aberto por esta versão.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer">
              <RadioGroupItem value="new" className="mt-0.5" />
              <span className="block text-sm font-medium">Salvar como um modelo novo</span>
            </label>
          </RadioGroup>
        )}
        {mode === "new" && (
          <div className="space-y-1.5">
            <Label htmlFor="preset-name">Nome do modelo</Label>
            <Input id="preset-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Culto da Família – Story" autoFocus onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving || (mode === "new" && name.trim().length < 2)} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
