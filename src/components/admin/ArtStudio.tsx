"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlignCenter, AlignLeft, Camera, Download, Loader2, Save, Send, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/fetcher";
import { formatBRL } from "@/lib/pix";
import { isClosed } from "@/lib/event-closure";
import {
  ART_BACKGROUNDS,
  ART_DEFAULTS,
  ART_FORMATS,
  ART_POSITIONS,
  ART_TEMPLATES,
  ART_THEMES,
  ordinalFirstDay,
  type ArtBackground,
  type ArtFormat,
  type ArtPosition,
  type ArtSpec,
  type ArtTemplate,
  type ArtThemeId,
} from "@/lib/art/spec";
import { Slider } from "@/components/ui/slider";
import { PresetGallery, SavePresetDialog, uploadThumb, type Preset } from "@/components/admin/ArtPresets";
import { ArtListEditor } from "@/components/admin/art/ArtListEditor";
import { DrivePhotoPicker } from "@/components/admin/art/DrivePhotoPicker";
import { CaptionBox, useCaption } from "@/components/admin/art/CaptionBox";
import { PublishDialog } from "@/components/admin/art/PublishDialog";
import { buildCaptions } from "@/lib/art/caption";
import { useContent } from "@/hooks/useSiteSettings";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface EventRow {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  description?: string | null;
  category?: string | null;
  is_published: boolean;
  registration_required: boolean;
  registrations_closed?: boolean;
  registrations_close_at?: string | null;
  contribution_cents?: number | null;
}
interface VerseRow {
  id: string;
  verse_text: string;
  verse_reference: string;
}

const tz = { timeZone: "America/Sao_Paulo" } as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "Sábado, 10 de outubro" e "19h30" */
const eventDate = (iso: string) => ordinalFirstDay(cap(new Date(iso).toLocaleDateString("pt-BR", { ...tz, weekday: "long", day: "numeric", month: "long" })));
const eventTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { ...tz, hour: "2-digit", minute: "2-digit" }).replace(":", "h");

const EMPTY: ArtSpec = {
  format: "feed",
  template: "evento",
  theme: "papel",
  tag: "",
  title: "",
  text: "",
  reference: "",
  date: "",
  time: "",
  location: "",
  highlight: "",
  photo: null,
  background: "cor",
  position: "base",
  align: "left",
  textColor: "#FFFFFF",
  accentColor: "#E8C26A",
  overlay: 40,
  showLogo: true,
  items: [],
  page: "",
};

/** Cores rápidas para as letras sobre imagem de fundo */
const QUICK_COLORS = ["#FFFFFF", "#F7F4EE", "#E8C26A", "#8EC5FF", "#161616", "#0F2742"];


/** Reduz a foto (lado maior até 1600px) e envia; devolve o endereço. */
async function uploadPhoto(file: File) {
  const img = new Image();
  const src = URL.createObjectURL(file);
  try {
    await new Promise<void>((ok, fail) => {
      img.onload = () => ok();
      img.onerror = () => fail(new Error("Não foi possível abrir a foto"));
      img.src = src;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    let quality = 0.85;
    let data = c.toDataURL("image/jpeg", quality);
    while (data.length > 1_900_000 && quality > 0.5) data = c.toDataURL("image/jpeg", (quality -= 0.1));
    return (await api<{ url: string }>("/api/admin/images", { method: "POST", json: { data, width: c.width, height: c.height } })).url;
  } finally {
    URL.revokeObjectURL(src);
  }
}

/** Gerador de artes para as redes (feed, story, capa de reels) com a identidade da igreja. */
export function ArtStudio() {
  const [spec, setSpec] = useState<ArtSpec>({ ...EMPTY, ...ART_DEFAULTS.evento });
  const [preview, setPreview] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [verses, setVerses] = useState<VerseRow[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<ArtSpec>) => setSpec((s) => ({ ...s, ...patch }));
  // evento escolhido em "Preencher com um evento" (link, tema e descrição na legenda)
  const [eventId, setEventId] = useState<string | null>(null);
  const { text: content } = useContent();
  const captions = useMemo(() => {
    const ev = spec.template === "evento" ? events.find((e) => e.id === eventId) : undefined;
    return buildCaptions(spec, {
      eventId: ev?.id ?? null,
      category: ev?.category,
      description: ev?.description,
      hashtags: content("social_hashtags"),
      closing: content("social_closing"),
    });
  }, [spec, eventId, events, content]);
  const caption = useCaption(captions, `${spec.template}-${eventId ?? ""}`);
  const [publishOpen, setPublishOpen] = useState(false);

  useEffect(() => {
    api<EventRow[]>("/api/admin/events")
      .then((rows) => setEvents(rows.filter((e) => new Date(e.event_date).getTime() > Date.now() - 6 * 3600_000).sort((a, b) => a.event_date.localeCompare(b.event_date))))
      .catch(() => {});
    api<VerseRow[]>("/api/verses").then(setVerses).catch(() => {});
  }, []);

  // prévia: gera a imagem no servidor um pouco depois da última alteração
  const key = JSON.stringify(spec);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      setRendering(true);
      try {
        const res = await fetch("/api/admin/art", { method: "POST", headers: { "Content-Type": "application/json" }, body: key });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Erro ${res.status}`);
        const blob = await res.blob();
        if (!alive) return;
        blobRef.current = blob;
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(blob);
        });
      } catch (err) {
        if (alive) toast.error(err instanceof Error ? err.message : "Erro ao gerar a arte");
      } finally {
        if (alive) setRendering(false);
      }
    }, 600);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [key]);

  // troca o modelo mantendo o visual (formato, cores, fundo)
  const changeTemplate = (template: ArtTemplate) =>
    setSpec((s) => ({
      ...EMPTY,
      format: s.format,
      theme: s.theme,
      photo: s.photo,
      background: s.background,
      position: s.position,
      align: s.align,
      textColor: s.textColor,
      accentColor: s.accentColor,
      overlay: s.overlay,
      showLogo: s.showLogo,
      ...ART_DEFAULTS[template],
      template,
    }));

  // modelos salvos
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  useEffect(() => {
    api<Preset[]>("/api/admin/art/presets").then(setPresets).catch(() => {});
  }, []);
  const applyPreset = (p: Preset) => {
    setSpec({ ...EMPTY, ...p.spec });
    setActivePreset(p.id);
    setEventId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const newArt = () => {
    setSpec({ ...EMPTY, ...ART_DEFAULTS.evento });
    setActivePreset(null);
    setEventId(null);
  };
  const savePreset = async (mode: "update" | "new", name: string) => {
    try {
      // miniatura feita com a prévia atual
      const thumb_url = blobRef.current ? await uploadThumb(blobRef.current) : null;
      const row =
        mode === "update" && activePreset
          ? await api<Preset>(`/api/admin/art/presets/${activePreset}`, { method: "PATCH", json: { spec, thumb_url } })
          : await api<Preset>("/api/admin/art/presets", { method: "POST", json: { name, spec, thumb_url } });
      setPresets((list) => [...list.filter((p) => p.id !== row.id), row].sort((a, b) => a.name.localeCompare(b.name)));
      setActivePreset(row.id);
      toast.success(`Modelo "${row.name}" salvo`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o modelo");
      throw err;
    }
  };

  const fillFromEvent = (id: string) => {
    const e = events.find((x) => x.id === id);
    if (!e) return;
    const signup = e.registration_required && !isClosed(e.registrations_closed, e.registrations_close_at);
    setEventId(e.id);
    set({
      template: "evento",
      tag: spec.tag || "EVENTO",
      title: e.title,
      date: eventDate(e.event_date),
      time: eventTime(e.event_date),
      location: e.location ?? "",
      highlight: signup ? `Inscrições abertas${e.contribution_cents ? ` • ${formatBRL(e.contribution_cents)}` : ""}` : "",
    });
  };

  const fileName = useMemo(() => {
    const base = (spec.title || spec.reference || ART_TEMPLATES[spec.template].label)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
    return `${base || "arte"}-${spec.format}.jpg`;
  }, [spec]);

  const download = () => {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview;
    a.download = fileName;
    a.click();
  };

  // no celular: abre o compartilhar do sistema (Instagram, WhatsApp...) já com a imagem
  const canShare = typeof navigator !== "undefined" && "canShare" in navigator;
  const share = async () => {
    const blob = blobRef.current;
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/jpeg" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
      } catch {
        /* cancelado */
      }
    } else download();
  };

  const pickPhoto = async (file: File) => {
    setUploading(true);
    try {
      set({ photo: { url: await uploadPhoto(file), x: 50, y: 35 } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar a foto");
    } finally {
      setUploading(false);
    }
  };

  const fmt = ART_FORMATS[spec.format];
  const field = (k: keyof ArtSpec, label: string, opts: { area?: boolean; placeholder?: string } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`art-${k}`}>{label}</Label>
      {opts.area ? (
        <Textarea id={`art-${k}`} rows={4} value={spec[k] as string} placeholder={opts.placeholder} onChange={(e) => set({ [k]: e.target.value })} />
      ) : (
        <Input id={`art-${k}`} value={spec[k] as string} placeholder={opts.placeholder} onChange={(e) => set({ [k]: e.target.value })} />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
    <SavePresetDialog
      key={saveOpen ? `aberto-${activePreset}` : "fechado"}
      open={saveOpen}
      onOpenChange={setSaveOpen}
      current={presets.find((p) => p.id === activePreset) ?? null}
      suggestedName={spec.title || spec.reference || ""}
      onSave={savePreset}
    />
    <div className="grid lg:grid-cols-[minmax(320px,400px)_1fr] gap-4 items-start">
      <Card className="lg:sticky lg:top-20">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Modelo</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(ART_TEMPLATES) as ArtTemplate[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => changeTemplate(t)}
                  title={ART_TEMPLATES[t].description}
                  className={cn(
                    "rounded-lg border-2 px-2 py-1.5 text-xs font-semibold min-h-0 leading-tight",
                    spec.template === t ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                  )}
                >
                  {ART_TEMPLATES[t].label.replace(" (reels / story)", "")}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Formato</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ART_FORMATS) as ArtFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => set({ format: f })}
                  className={cn(
                    "rounded-lg border-2 px-2 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 min-h-0",
                    spec.format === f ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50",
                  )}
                >
                  <span className="block border-2 border-current rounded-sm" style={{ width: 10, height: (10 * ART_FORMATS[f].height) / ART_FORMATS[f].width }} />
                  {ART_FORMATS[f].label}
                </button>
              ))}
            </div>
          </div>

          <Tabs defaultValue="texto" className="space-y-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="modelos">Salvos{presets.length ? ` (${presets.length})` : ""}</TabsTrigger>
              <TabsTrigger value="texto">Texto</TabsTrigger>
              <TabsTrigger value="visual">Visual</TabsTrigger>
            </TabsList>
            {/* com altura limitada no computador, a página não rola: só a aba, se precisar */}
            <TabsContent value="modelos" className="mt-0 lg:max-h-[calc(100vh-31rem)] lg:min-h-48 lg:overflow-y-auto lg:pr-1">
              <PresetGallery grid presets={presets} activeId={activePreset} onOpen={applyPreset} onNew={newArt} setPresets={setPresets} />
            </TabsContent>
            <TabsContent value="texto" className="space-y-3 mt-0 lg:max-h-[calc(100vh-31rem)] lg:min-h-48 lg:overflow-y-auto lg:pr-1">
              {spec.template === "evento" && events.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Preencher com um evento</Label>
                  <Select onValueChange={fillFromEvent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um evento da programação" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {new Date(e.event_date).toLocaleDateString("pt-BR", { ...tz, day: "2-digit", month: "2-digit" })} • {e.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {spec.template === "versiculo" && verses.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Usar um versículo cadastrado</Label>
                  <Select
                    onValueChange={(id) => {
                      const v = verses.find((x) => x.id === id);
                      if (v) set({ text: v.verse_text, reference: v.verse_reference });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um versículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {verses.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.verse_reference}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-3">
                {field("tag", "Etiqueta no alto", { placeholder: "Ex.: EVENTO, HOJE TEM (vazio = sem etiqueta)" })}
                {spec.template !== "versiculo" &&
                  field("title", spec.template === "aniversariantes" ? "Mês" : spec.template === "programacao" ? "Período (ex.: 26 out a 1 nov)" : "Título")}
                {(spec.template === "programacao" || spec.template === "aniversariantes") && <ArtListEditor spec={spec} set={set} events={events} />}
                {spec.template === "aniversariantes" && field("text", "Mensagem (opcional)")}
                {spec.template === "evento" && (
                  <>
                    <div className="grid grid-cols-[1fr_7rem] gap-2">
                      {field("date", "Data")}
                      {field("time", "Horário")}
                    </div>
                    {field("location", "Local")}
                    {field("highlight", "Destaque (opcional)", { placeholder: "Ex.: Inscrições abertas • R$ 20,00" })}
                  </>
                )}
                {spec.template === "aviso" && field("text", "Texto", { area: true })}
                {spec.template === "versiculo" && (
                  <>
                    {field("text", "Versículo", { area: true })}
                    {field("reference", "Referência", { placeholder: "Ex.: João 3:16" })}
                  </>
                )}
                {spec.template === "capa" && field("text", "Subtítulo (opcional)")}
              </div>

            </TabsContent>
            <TabsContent value="visual" className="space-y-4 mt-0 lg:max-h-[calc(100vh-31rem)] lg:min-h-48 lg:overflow-y-auto lg:pr-1">
              {spec.background !== "imagem" && (
              <div className="space-y-2">
                <Label>Cores</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ART_THEMES) as ArtThemeId[]).map((id) => {
                    const th = ART_THEMES[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => set({ theme: id })}
                        title={th.label}
                        className={cn(
                          "flex items-center gap-2 rounded-full border-2 pl-1 pr-3 py-1 text-xs min-h-0",
                          spec.theme === id ? "border-primary" : "border-border",
                        )}
                      >
                        <span className="w-6 h-6 rounded-full border" style={{ background: th.bg, boxShadow: `inset 0 0 0 4px ${th.accent}` }} />
                        {th.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              )}

              <div className="space-y-3">
                <Label>Fundo</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(ART_BACKGROUNDS) as ArtBackground[]).map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => set({ background: bg })}
                      className={cn(
                        "rounded-lg border-2 px-2 py-2 text-xs font-medium min-h-0",
                        spec.background === bg ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50",
                      )}
                    >
                      {ART_BACKGROUNDS[bg].label}
                    </button>
                  ))}
                </div>
                {spec.background !== "cor" && (
                <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) pickPhoto(f);
                  }}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    {spec.photo ? "Trocar foto" : "Enviar foto"}
                  </Button>
                  <DrivePhotoPicker onPick={(url) => set({ photo: { url, x: 50, y: 40 } })} />
                  {spec.photo && (
                    <Button type="button" variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => set({ photo: null })}>
                      <X className="w-4 h-4" /> Tirar foto
                    </Button>
                  )}
                </div>
                {spec.photo && (
                  <>
                    <p className="text-xs text-muted-foreground">Toque na parte da foto que deve ficar no centro (ex.: o rosto).</p>
                    <div
                      className="relative w-fit cursor-crosshair select-none"
                      onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        const x = Math.round(((e.clientX - r.left) / r.width) * 100);
                        const y = Math.round(((e.clientY - r.top) / r.height) * 100);
                        set({ photo: { ...spec.photo!, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } });
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={spec.photo.url} alt="" className="max-h-48 max-w-full rounded" draggable={false} />
                      <span
                        className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.5)] pointer-events-none"
                        style={{ left: `${spec.photo.x}%`, top: `${spec.photo.y}%` }}
                      />
                    </div>
                  </>
                )}
                {spec.background === "imagem" && (
                  <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Posição do texto</Label>
                      <div className="flex gap-2">
                        {(Object.keys(ART_POSITIONS) as ArtPosition[]).map((pos) => (
                          <Button key={pos} type="button" size="sm" variant={spec.position === pos ? "default" : "outline"} onClick={() => set({ position: pos })}>
                            {ART_POSITIONS[pos]}
                          </Button>
                        ))}
                        <Button type="button" size="icon" variant={spec.align === "left" ? "default" : "outline"} onClick={() => set({ align: "left" })} aria-label="Alinhar à esquerda" title="Alinhar à esquerda">
                          <AlignLeft className="w-4 h-4" />
                        </Button>
                        <Button type="button" size="icon" variant={spec.align === "center" ? "default" : "outline"} onClick={() => set({ align: "center" })} aria-label="Centralizar" title="Centralizar">
                          <AlignCenter className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {(["textColor", "accentColor"] as const).map((k) => (
                      <div key={k} className="space-y-1.5">
                        <Label className="text-xs">{k === "textColor" ? "Cor das letras" : "Cor dos detalhes (linhas e etiqueta)"}</Label>
                        <div className="flex items-center gap-2">
                          {QUICK_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => set({ [k]: c })}
                              className={cn("w-7 h-7 rounded-full border-2 min-h-0 min-w-0", spec[k].toLowerCase() === c.toLowerCase() ? "border-primary" : "border-border")}
                              style={{ background: c }}
                              aria-label={c}
                            />
                          ))}
                          <input type="color" value={spec[k]} onChange={(e) => set({ [k]: e.target.value })} className="w-9 h-8 rounded border bg-transparent p-0.5 cursor-pointer" aria-label="Outra cor" />
                        </div>
                      </div>
                    ))}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Escurecer a imagem: {spec.overlay}%</Label>
                      <Slider min={0} max={85} step={5} value={[spec.overlay]} onValueChange={([v]) => set({ overlay: v })} />
                    </div>
                    <label className="flex items-center justify-between gap-2 text-sm">
                      <span>Mostrar logo e nome da igreja</span>
                      <Switch checked={spec.showLogo} onCheckedChange={(v) => set({ showLogo: v })} />
                    </label>
                  </div>
                )}
                </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* no celular a prévia vem primeiro, para ver as mudanças sem rolar */}
      <div className="min-w-0 order-first lg:order-none lg:sticky lg:top-20 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(250px,300px)] items-start">
        <div className="space-y-3 min-w-0">
        <div
          className="relative mx-auto w-full rounded-lg border bg-muted overflow-hidden shadow-sm"
          style={{
            // no computador a prévia cabe na altura da tela (sem rolar)
            maxWidth: `min(${spec.format === "story" ? 380 : 480}px, calc((100vh - 17rem) * ${fmt.width / fmt.height}))`,
            aspectRatio: `${fmt.width} / ${fmt.height}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="Prévia da arte" className="w-full h-full object-contain" />}
          {rendering && (
            <div className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 shadow">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>
        </div>
        <div className="space-y-3 min-w-0">
        <div className="flex flex-wrap gap-2 justify-center xl:justify-start">
          <Button onClick={download} disabled={!preview} className="gap-2">
            <Download className="w-4 h-4" /> Baixar imagem
          </Button>
          <Button variant="outline" onClick={() => setSaveOpen(true)} disabled={!preview} className="gap-2">
            <Save className="w-4 h-4" /> Salvar como modelo
          </Button>
          {canShare && (
            <Button variant="outline" onClick={share} disabled={!preview} className="gap-2">
              <Share2 className="w-4 h-4" /> Compartilhar
            </Button>
          )}
          <Button variant="outline" onClick={() => setPublishOpen(true)} disabled={!preview} className="gap-2">
            <Send className="w-4 h-4" /> Publicar nas redes
          </Button>
          <PublishDialog
            key={publishOpen ? "aberto" : "fechado"}
            open={publishOpen}
            onOpenChange={setPublishOpen}
            title={spec.title || spec.reference || ART_TEMPLATES[spec.template].label}
            specs={[spec]}
            caption={caption.text}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center xl:text-left">
          {fmt.width} × {fmt.height} px, pronta para o Instagram e o Facebook. No celular, “Compartilhar” abre direto o app.
        </p>
        <CaptionBox caption={caption} />
        </div>
      </div>
    </div>
    </div>
  );
}
