"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Camera, Loader2, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/fetcher";
import { CONTENT_SECTIONS, type ContentSection, type ListKey } from "@/lib/site-content";
import {
  DEFAULT_MINISTRIES,
  DEFAULT_PASTORS,
  DEFAULT_VALUES,
  VALUE_ICONS,
  parseList,
  type Ministry,
  type Pastor,
  type Photo,
  type ValueIcon,
  type ValueItem,
} from "@/lib/about-content";
import { PhotoCircle } from "@/components/content/PhotoCircle";
import { VALUE_ICON_COMPONENTS } from "@/components/content/value-icons";

type Values = Record<string, string>;

async function saveSettings(entries: { setting_key: string; setting_value: string }[]) {
  await api("/api/admin/settings", { method: "PUT", json: { settings: entries } });
}

/** Reduz a imagem no navegador (lado maior até 1000px, JPEG) e envia; devolve o endereço dela. */
async function uploadImage(file: File): Promise<{ url: string; ratio: number }> {
  const img = new Image();
  const src = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Não foi possível abrir a imagem"));
      img.src = src;
    });
    const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/jpeg", 0.85);
    const res = await api<{ url: string }>("/api/admin/images", { method: "POST", json: { data, width: canvas.width, height: canvas.height } });
    return { url: res.url, ratio: canvas.width / canvas.height };
  } finally {
    URL.revokeObjectURL(src);
  }
}

// ---------------- Textos ----------------

function TextsEditor({ section, values, onSaved }: { section: ContentSection; values: Values; onSaved: (v: Values) => void }) {
  const initial = useMemo(() => Object.fromEntries(section.fields.map((f) => [f.key, values[f.key] || f.default])), [section, values]);
  const [draft, setDraft] = useState<Values>(initial);
  const [saving, setSaving] = useState(false);
  const dirty = section.fields.filter((f) => (draft[f.key] ?? "") !== (initial[f.key] ?? ""));

  const save = async () => {
    setSaving(true);
    try {
      // igual ao padrão (ou vazio) = guarda vazio, para continuar seguindo o texto padrão
      const entries = dirty.map((f) => {
        const v = (draft[f.key] ?? "").trim();
        return { setting_key: f.key, setting_value: v === f.default ? "" : v };
      });
      await saveSettings(entries);
      onSaved(Object.fromEntries(entries.map((e) => [e.setting_key, e.setting_value])));
      toast.success("Textos salvos! Já aparecem no site.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {section.fields.map((f) => {
          const changed = (draft[f.key] ?? "") !== f.default;
          return (
            <div key={f.key} className={`space-y-1.5 ${f.type === "textarea" ? "md:col-span-2" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`c-${f.key}`}>{f.label}</Label>
                {changed && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 min-h-0 min-w-0"
                    onClick={() => setDraft({ ...draft, [f.key]: f.default })}
                    title="Voltar ao texto original"
                  >
                    <RotateCcw className="w-3 h-3" /> original
                  </button>
                )}
              </div>
              {f.type === "textarea" ? (
                <Textarea id={`c-${f.key}`} rows={3} value={draft[f.key] ?? ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
              ) : (
                <Input id={`c-${f.key}`} value={draft[f.key] ?? ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
              )}
              {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
            </div>
          );
        })}
      </div>
      <SaveBar dirty={dirty.length > 0} saving={saving} onSave={save} label={dirty.length ? `Salvar textos (${dirty.length})` : "Salvar textos"} />
    </div>
  );
}

function SaveBar({ dirty, saving, onSave, label }: { dirty: boolean; saving: boolean; onSave: () => void; label: string }) {
  return (
    <div className="sticky bottom-0 -mx-1 px-1 py-3 bg-background/95 backdrop-blur flex justify-end border-t">
      <Button onClick={onSave} disabled={!dirty || saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {label}
      </Button>
    </div>
  );
}

// ---------------- Listas ----------------

function useListEditor<T>(key: ListKey, values: Values, fallback: T[], onSaved: (v: Values) => void) {
  const initial = useMemo(() => parseList<T>(values[key], fallback), [values, key, fallback]);
  const [items, setItems] = useState<T[]>(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);
  const update = (i: number, patch: Partial<T>) => setItems((list) => list.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i: number, d: -1 | 1) =>
    setItems((list) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  const remove = (i: number) => setItems((list) => list.filter((_, j) => j !== i));
  const add = (item: T) => setItems((list) => [...list, item]);
  const save = async () => {
    setSaving(true);
    try {
      const value = JSON.stringify(items);
      await saveSettings([{ setting_key: key, setting_value: value }]);
      onSaved({ [key]: value });
      toast.success("Salvo! Já aparece no site.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };
  return { items, update, move, remove, add, dirty, saving, save };
}

function ItemActions({ index, total, onMove, onRemove, label }: { index: number; total: number; onMove: (d: -1 | 1) => void; onRemove: () => void; label: string }) {
  return (
    <div className="flex gap-1 shrink-0">
      <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Subir" title="Subir">
        <ArrowUp className="w-4 h-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Descer" title="Descer">
        <ArrowDown className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        onClick={() => confirm(`Remover ${label}?`) && onRemove()}
        aria-label="Remover"
        title="Remover"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

/** Foto com envio e enquadramento: toque no rosto para centralizar e use o zoom. */
function PhotoPicker({ photo, name, onChange }: { photo: Photo | null; name: string; onChange: (p: Photo | null) => void }) {
  const [uploading, setUploading] = useState(false);
  const [adjust, setAdjust] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (file: File) => {
    setUploading(true);
    try {
      const { url, ratio } = await uploadImage(file);
      // rosto costuma ficar no alto da foto: começa centralizado um pouco acima do meio
      onChange({ url, ratio, x: 50, y: 30, zoom: 1.4 });
      setAdjust(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar a foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <PhotoCircle photo={photo} alt={name} className="w-24 h-24 shrink-0 ring-2 ring-border" />
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) pick(f);
            }}
          />
          <Button type="button" variant="outline" size="sm" className="gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {photo ? "Trocar foto" : "Enviar foto"}
          </Button>
          {photo && (
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdjust((a) => !a)}>
                {adjust ? "Fechar ajuste" : "Ajustar"}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1" onClick={() => onChange(null)}>
                <X className="w-4 h-4" /> Tirar
              </Button>
            </div>
          )}
        </div>
      </div>
      {photo && adjust && (
        <div className="rounded-lg border p-3 space-y-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">Toque no rosto da pessoa para centralizar. Use o zoom para aproximar.</p>
          <div
            className="relative mx-auto w-fit cursor-crosshair select-none"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const x = Math.round(((e.clientX - r.left) / r.width) * 100);
              const y = Math.round(((e.clientY - r.top) / r.height) * 100);
              onChange({ ...photo, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="" className="max-h-80 max-w-full rounded" draggable={false} />
            <span
              className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.5)] pointer-events-none"
              style={{ left: `${photo.x}%`, top: `${photo.y}%` }}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10">Zoom</span>
            <Slider min={1} max={4} step={0.1} value={[photo.zoom]} onValueChange={([z]) => onChange({ ...photo, zoom: z })} className="flex-1" />
            <span className="text-xs w-8 text-right">{photo.zoom.toFixed(1)}x</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PastorsEditor({ values, onSaved }: { values: Values; onSaved: (v: Values) => void }) {
  const l = useListEditor<Pastor>("about_pastors", values, DEFAULT_PASTORS, onSaved);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">A ordem aqui é a ordem no site. A foto aparece num círculo: depois de enviar, toque no rosto para centralizar.</p>
      {l.items.map((p, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <PhotoPicker photo={p.photo} name={p.name} onChange={(photo) => l.update(i, { photo })} />
              <ItemActions index={i} total={l.items.length} onMove={(d) => l.move(i, d)} onRemove={() => l.remove(i)} label={p.name || "este pastor"} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={p.name} onChange={(e) => l.update(i, { name: e.target.value })} placeholder="Ex.: Pr. João" />
              </div>
              <div className="space-y-1.5">
                <Label>Função</Label>
                <Input value={p.role} onChange={(e) => l.update(i, { role: e.target.value })} placeholder="Ex.: Pastor Auxiliar" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Descrição</Label>
                <Textarea rows={2} value={p.description} onChange={(e) => l.update(i, { description: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button type="button" variant="outline" className="w-full gap-2" onClick={() => l.add({ name: "", role: "Pastor Auxiliar", description: "", photo: null })}>
        <Plus className="w-4 h-4" /> Adicionar pastor
      </Button>
      <SaveBar dirty={l.dirty} saving={l.saving} onSave={l.save} label="Salvar pastores" />
    </div>
  );
}

function MinistriesEditor({ values, onSaved }: { values: Values; onSaved: (v: Values) => void }) {
  const l = useListEditor<Ministry>("about_ministries", values, DEFAULT_MINISTRIES, onSaved);
  return (
    <div className="space-y-3">
      {l.items.map((m, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="grid flex-1 gap-3 sm:grid-cols-[4.5rem_1fr_1fr]">
                <div className="space-y-1.5">
                  <Label>Ícone</Label>
                  <Input value={m.icon} maxLength={4} className="text-center text-xl" onChange={(e) => l.update(i, { icon: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={m.name} onChange={(e) => l.update(i, { name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Input value={m.type} onChange={(e) => l.update(i, { type: e.target.value })} placeholder="Ex.: Grupo de Louvor" />
                </div>
                <div className="space-y-1.5 sm:col-span-3">
                  <Label>Líderes</Label>
                  <Input value={m.leaders} onChange={(e) => l.update(i, { leaders: e.target.value })} />
                </div>
              </div>
              <ItemActions index={i} total={l.items.length} onMove={(d) => l.move(i, d)} onRemove={() => l.remove(i)} label={m.name || "este ministério"} />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button type="button" variant="outline" className="w-full gap-2" onClick={() => l.add({ name: "", type: "", leaders: "", icon: "⭐" })}>
        <Plus className="w-4 h-4" /> Adicionar ministério
      </Button>
      <p className="text-xs text-muted-foreground">Ícone: um emoji (no celular, use o teclado de emojis).</p>
      <SaveBar dirty={l.dirty} saving={l.saving} onSave={l.save} label="Salvar ministérios" />
    </div>
  );
}

function ValuesEditor({ values, onSaved }: { values: Values; onSaved: (v: Values) => void }) {
  const l = useListEditor<ValueItem>("about_values", values, DEFAULT_VALUES, onSaved);
  return (
    <div className="space-y-3">
      {l.items.map((v, i) => {
        const Icon = (VALUE_ICON_COMPONENTS[v.icon] ?? VALUE_ICON_COMPONENTS.heart).icon;
        return (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-[10rem_1fr]">
                  <div className="space-y-1.5">
                    <Label>Ícone</Label>
                    <Select value={v.icon} onValueChange={(icon) => l.update(i, { icon: icon as ValueIcon })}>
                      <SelectTrigger>
                        <SelectValue>
                          <span className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-primary" /> {VALUE_ICON_COMPONENTS[v.icon]?.label}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {VALUE_ICONS.map((k) => {
                          const I = VALUE_ICON_COMPONENTS[k].icon;
                          return (
                            <SelectItem key={k} value={k}>
                              <span className="flex items-center gap-2">
                                <I className="w-4 h-4 text-primary" /> {VALUE_ICON_COMPONENTS[k].label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Título</Label>
                    <Input value={v.title} onChange={(e) => l.update(i, { title: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Descrição</Label>
                    <Textarea rows={2} value={v.description} onChange={(e) => l.update(i, { description: e.target.value })} />
                  </div>
                </div>
                <ItemActions index={i} total={l.items.length} onMove={(d) => l.move(i, d)} onRemove={() => l.remove(i)} label={v.title || "este valor"} />
              </div>
            </CardContent>
          </Card>
        );
      })}
      <Button type="button" variant="outline" className="w-full gap-2" onClick={() => l.add({ icon: "star", title: "", description: "" })}>
        <Plus className="w-4 h-4" /> Adicionar valor
      </Button>
      <SaveBar dirty={l.dirty} saving={l.saving} onSave={l.save} label="Salvar valores" />
    </div>
  );
}

/** Aba "Conteúdo do site" das Configurações: textos de cada página e as listas da página Sobre. */
export function SiteContentEditor({ values, onSaved }: { values: Values; onSaved: (v: Values) => void }) {
  const tabs = [
    ...CONTENT_SECTIONS.map((s) => ({ id: s.id, title: s.title })),
    { id: "pastors", title: "Pastores" },
    { id: "ministries", title: "Ministérios" },
    { id: "values", title: "Valores" },
  ];
  return (
    <Tabs defaultValue="home" className="w-full">
      <TabsList className="flex flex-wrap h-auto w-full justify-start">
        {tabs.map((t) => (
          <TabsTrigger key={t.id} value={t.id} className="text-xs sm:text-sm">
            {t.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {CONTENT_SECTIONS.map((s) => (
        <TabsContent key={s.id} value={s.id} className="mt-5">
          <TextsEditor section={s} values={values} onSaved={onSaved} />
        </TabsContent>
      ))}
      <TabsContent value="pastors" className="mt-5">
        <PastorsEditor values={values} onSaved={onSaved} />
      </TabsContent>
      <TabsContent value="ministries" className="mt-5">
        <MinistriesEditor values={values} onSaved={onSaved} />
      </TabsContent>
      <TabsContent value="values" className="mt-5">
        <ValuesEditor values={values} onSaved={onSaved} />
      </TabsContent>
    </Tabs>
  );
}

