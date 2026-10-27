"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlignCenter, AlignLeft, ArrowLeft, ArrowRight, BookOpen, Cake, CalendarDays, Camera, Check, Clapperboard, Download, ListChecks, Loader2, Megaphone, Save, Send, Share2, X, type LucideIcon } from "lucide-react";
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
import { PublishForm } from "@/components/admin/art/PublishDialog";
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

const STEPS = [
  { id: "comecar", label: "Começar" },
  { id: "editar", label: "Editar a arte" },
  { id: "finalizar", label: "Legenda e publicar" },
] as const;
type Step = (typeof STEPS)[number]["id"];

const TEMPLATE_ICONS: Record<ArtTemplate, LucideIcon> = {
  evento: CalendarDays,
  versiculo: BookOpen,
  aviso: Megaphone,
  capa: Clapperboard,
  programacao: ListChecks,
  aniversariantes: Cake,
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
  // etapas: começar (modelo ou tipo) → editar → legenda e publicar
  const [step, setStep] = useState<Step>("comecar");
  const go = (s: Step) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  // campos da arte a partir de um evento da programação
  const eventFields = (e: EventRow): Partial<ArtSpec> => {
    const signup = e.registration_required && !isClosed(e.registrations_closed, e.registrations_close_at);
    return {
      template: "evento",
      title: e.title,
      date: eventDate(e.event_date),
      time: eventTime(e.event_date),
      location: e.location ?? "",
      highlight: signup ? `Inscrições abertas${e.contribution_cents ? ` • ${formatBRL(e.contribution_cents)}` : ""}` : "",
    };
  };
  const fillFromEvent = (id: string) => {
    const e = events.find((x) => x.id === id);
    if (!e) return;
    setEventId(e.id);
    set({ ...eventFields(e), tag: spec.tag || "EVENTO" });
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

  const fileReady = !!preview && !rendering;
  const previewBox = (maxH: string, maxW: number) => (
    <div
      className="relative mx-auto w-full rounded-lg border bg-muted overflow-hidden shadow-sm"
      style={{ maxWidth: `min(${maxW}px, calc((${maxH}) * ${fmt.width / fmt.height}))`, aspectRatio: `${fmt.width} / ${fmt.height}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {preview && <img src={preview} alt="Prévia da arte" className="w-full h-full object-contain" />}
      {rendering && (
        <div className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 shadow">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        </div>
      )}
    </div>
  );

  // começar do zero com um tipo de arte
  const startFresh = (t: ArtTemplate) => {
    setSpec({ ...EMPTY, format: spec.format, ...ART_DEFAULTS[t], template: t });
    setActivePreset(null);
    setEventId(null);
    go("editar");
  };
  const startFromEvent = (id: string) => {
    const e = events.find((x) => x.id === id);
    if (!e) return;
    setSpec({ ...EMPTY, format: spec.format, ...ART_DEFAULTS.evento, ...eventFields(e) });
    setActivePreset(null);
    setEventId(e.id);
    go("editar");
  };

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

      {/* etapas: dá para voltar a qualquer uma já visitada; avançar/voltar ficam sempre à vista */}
      <div className="flex flex-wrap items-center justify-between gap-2">
      <ol className="flex items-center gap-1 sm:gap-2 text-sm" aria-label="Etapas">
        {STEPS.map((s, i) => {
          const idx = STEPS.findIndex((x) => x.id === step);
          const done = i < idx;
          const can = i <= idx || (s.id === "finalizar" && step === "editar" && fileReady);
          return (
            <li key={s.id} className="flex items-center gap-1 sm:gap-2 min-w-0">
              {i > 0 && <span className={cn("h-px w-4 sm:w-10 shrink-0", done || s.id === step ? "bg-primary" : "bg-border")} />}
              <button
                type="button"
                disabled={!can}
                onClick={() => go(s.id)}
                aria-current={s.id === step ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-2 sm:px-3 py-1.5 min-h-0 min-w-0 transition-colors",
                  s.id === step ? "bg-primary text-primary-foreground" : done ? "text-primary hover:bg-primary/10" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    s.id === step ? "bg-primary-foreground/20" : done ? "bg-primary text-primary-foreground" : "border",
                  )}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span className={cn("truncate font-medium", s.id !== step && "hidden sm:inline")}>{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {step === "editar" && (
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={() => go("comecar")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button onClick={() => go("finalizar")} disabled={!fileReady} className="gap-2">
            Arte pronta, continuar <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
      {step === "finalizar" && (
        <Button variant="outline" onClick={() => go("editar")} className="gap-2 ml-auto">
          <ArrowLeft className="w-4 h-4" /> Editar a arte
        </Button>
      )}
      </div>

      {step === "comecar" && (
        <div className="space-y-6">
          {presets.length > 0 && (
            <section className="space-y-2">
              <div>
                <h3 className="font-semibold">Usar um modelo salvo</h3>
              </div>
              <PresetGallery
                grid
                hideNew
                presets={presets}
                activeId={activePreset}
                onOpen={(p) => {
                  applyPreset(p);
                  go("editar");
                }}
                onNew={() => {}}
                setPresets={setPresets}
              />
            </section>
          )}

          <section className="space-y-2">
            <div>
              <h3 className="font-semibold">{presets.length > 0 ? "Ou começar do zero" : "Começar uma arte"}</h3>
              <p className="text-sm text-muted-foreground">Escolha o tipo de arte.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {(Object.keys(ART_TEMPLATES) as ArtTemplate[]).map((t) => {
                const Icon = TEMPLATE_ICONS[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => startFresh(t)}
                    className="rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 p-3 text-left min-h-0 flex flex-col gap-2 transition-colors"
                  >
                    <Icon className="w-6 h-6 text-primary" />
                    <span className="block text-sm font-semibold leading-tight">{ART_TEMPLATES[t].label}</span>
                    <span className="block text-[11px] text-muted-foreground leading-tight">{ART_TEMPLATES[t].description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {events.length > 0 && (
            <section className="space-y-2 max-w-md">
              <div>
                <h3 className="font-semibold">Ou direto de um evento da programação</h3>
                <p className="text-sm text-muted-foreground">Já vem com título, data, horário e local preenchidos.</p>
              </div>
              <Select onValueChange={startFromEvent}>
                <SelectTrigger aria-label="Evento da programação">
                  <SelectValue placeholder="Escolha um evento" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {new Date(e.event_date).toLocaleDateString("pt-BR", { ...tz, day: "2-digit", month: "2-digit" })} • {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
          )}
        </div>
      )}

      {step === "editar" && (
        <div className="grid lg:grid-cols-[minmax(320px,420px)_1fr] gap-4 items-start">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  {ART_TEMPLATES[spec.template].label}
                  {activePreset ? ` · modelo “${presets.find((p) => p.id === activePreset)?.name ?? ""}”` : ""}
                </span>
                <Button variant="link" size="sm" className="h-auto p-0 min-h-0" onClick={() => go("comecar")}>
                  Trocar tipo ou modelo
                </Button>
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
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="texto">Texto</TabsTrigger>
                  <TabsTrigger value="visual">Cores e fundo</TabsTrigger>
                </TabsList>
                <TabsContent value="texto" className="space-y-3 mt-0">
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
                <TabsContent value="visual" className="space-y-4 mt-0">
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
          <div className="min-w-0 space-y-3 order-first lg:order-none lg:sticky lg:top-20">
            {previewBox("100vh - 19rem", spec.format === "story" ? 380 : 520)}
          </div>
        </div>
      )}

      {step === "finalizar" && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] gap-4 items-start">
          <div className="min-w-0 space-y-3 lg:sticky lg:top-20">
            {previewBox("100vh - 19rem", spec.format === "story" ? 360 : 480)}
            <p className="text-xs text-muted-foreground text-center">
              {fmt.width} × {fmt.height} px, pronta para o Instagram e o Facebook.
            </p>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="flex flex-wrap gap-2">
              <Button onClick={download} disabled={!preview} className="gap-2">
                <Download className="w-4 h-4" /> Baixar imagem
              </Button>
              {canShare && (
                <Button variant="outline" onClick={share} disabled={!preview} className="gap-2">
                  <Share2 className="w-4 h-4" /> Compartilhar
                </Button>
              )}
              <Button variant="outline" onClick={() => setSaveOpen(true)} disabled={!preview} className="gap-2">
                <Save className="w-4 h-4" /> Salvar como modelo
              </Button>
            </div>
            <CaptionBox caption={caption} />
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" /> Publicar nas redes
                </h3>
                <PublishForm
                  key={key}
                  title={spec.title || spec.reference || ART_TEMPLATES[spec.template].label}
                  specs={[spec]}
                  caption={caption.text}
                  onDone={() => go("comecar")}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
