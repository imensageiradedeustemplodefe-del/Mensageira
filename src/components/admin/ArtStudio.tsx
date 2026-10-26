"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Download, Loader2, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/fetcher";
import { formatBRL } from "@/lib/pix";
import { isClosed } from "@/lib/event-closure";
import { ART_DEFAULTS, ART_FORMATS, ART_TEMPLATES, ART_THEMES, ordinalFirstDay, type ArtFormat, type ArtSpec, type ArtTemplate, type ArtThemeId } from "@/lib/art/spec";
import { cn } from "@/lib/utils";

interface EventRow {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
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

const EMPTY: ArtSpec = { format: "feed", template: "evento", theme: "azul", tag: "", title: "", text: "", reference: "", date: "", time: "", location: "", highlight: "", photo: null };

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

  const changeTemplate = (template: ArtTemplate) => setSpec((s) => ({ ...EMPTY, format: s.format, theme: s.theme, photo: s.photo, ...ART_DEFAULTS[template], template }));

  const fillFromEvent = (id: string) => {
    const e = events.find((x) => x.id === id);
    if (!e) return;
    const signup = e.registration_required && !isClosed(e.registrations_closed, e.registrations_close_at);
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
    <div className="grid lg:grid-cols-[minmax(320px,420px)_1fr] gap-4 items-start">
      <Card>
        <CardContent className="p-4 space-y-5">
          <div className="space-y-2">
            <Label>Formato</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ART_FORMATS) as ArtFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => set({ format: f })}
                  className={cn(
                    "rounded-lg border-2 px-2 py-2 text-xs font-medium flex flex-col items-center gap-1 min-h-0",
                    spec.format === f ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50",
                  )}
                >
                  <span className="block border-2 border-current rounded-sm" style={{ width: 18, height: (18 * ART_FORMATS[f].height) / ART_FORMATS[f].width }} />
                  {ART_FORMATS[f].label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Modelo</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ART_TEMPLATES) as ArtTemplate[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => changeTemplate(t)}
                  className={cn(
                    "rounded-lg border-2 p-2 text-left min-h-0 block",
                    spec.template === t ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                  )}
                >
                  <span className="block text-sm font-semibold">{ART_TEMPLATES[t].label}</span>
                  <span className="block text-[11px] text-muted-foreground leading-tight">{ART_TEMPLATES[t].description}</span>
                </button>
              ))}
            </div>
          </div>

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
                    <span className="w-6 h-6 rounded-full border" style={{ background: `linear-gradient(135deg, ${th.from}, ${th.to})`, boxShadow: `inset 0 0 0 4px ${th.accent}` }} />
                    {th.label}
                  </button>
                );
              })}
            </div>
          </div>

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

          <div className="space-y-3 border-t pt-4">
            {field("tag", "Etiqueta no alto", { placeholder: "Ex.: EVENTO, HOJE TEM (vazio = sem etiqueta)" })}
            {spec.template !== "versiculo" && field("title", "Título")}
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

          <div className="space-y-2 border-t pt-4">
            <Label>Foto de fundo (opcional)</Label>
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
          </div>
        </CardContent>
      </Card>

      {/* no celular a prévia vem primeiro, para ver as mudanças sem rolar */}
      <div className="space-y-3 order-first lg:order-none lg:sticky lg:top-20">
        <div
          className="relative mx-auto w-full rounded-lg border bg-muted overflow-hidden shadow-sm"
          style={{ maxWidth: spec.format === "story" ? 380 : 520, aspectRatio: `${fmt.width} / ${fmt.height}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="Prévia da arte" className="w-full h-full object-contain" />}
          {rendering && (
            <div className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 shadow">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={download} disabled={!preview} className="gap-2">
            <Download className="w-4 h-4" /> Baixar imagem
          </Button>
          {canShare && (
            <Button variant="outline" onClick={share} disabled={!preview} className="gap-2">
              <Share2 className="w-4 h-4" /> Compartilhar
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {fmt.width} × {fmt.height} px, pronta para o Instagram e o Facebook. No celular, “Compartilhar” abre direto o app.
        </p>
      </div>
    </div>
  );
}
