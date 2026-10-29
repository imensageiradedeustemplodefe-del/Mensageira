"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Download, Loader2, Plus, Send, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/fetcher";
import { artSpecSchema, ART_FORMATS, ART_THEMES, type ArtFormat, type ArtSpec, type ArtThemeId } from "@/lib/art/spec";
import { useContent } from "@/hooks/useSiteSettings";
import { CaptionBox, useCaption } from "@/components/admin/art/CaptionBox";
import { PublishDialog } from "@/components/admin/art/PublishDialog";
import { PostPreview } from "@/components/admin/art/PostPreview";
import { carouselCaptions } from "@/lib/art/caption";
import type { Preset } from "@/components/admin/ArtPresets";
import { cn } from "@/lib/utils";

type SlideKind = "capa" | "aviso" | "versiculo";
interface Slide {
  kind: SlideKind;
  title: string;
  text: string;
  reference: string;
}
const KIND_LABEL: Record<SlideKind, string> = { capa: "Capa", aviso: "Texto", versiculo: "Versículo" };

const START: Slide[] = [
  { kind: "capa", title: "Título do carrossel", text: "Arraste para o lado →", reference: "" },
  { kind: "aviso", title: "Primeiro ponto", text: "Escreva aqui o texto do slide.", reference: "" },
  { kind: "versiculo", title: "", text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.", reference: "Salmos 119:105" },
];

async function render(spec: ArtSpec) {
  const res = await fetch("/api/admin/art", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(spec) });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Erro ${res.status}`);
  return res.blob();
}

/** Carrossel: vários slides com o mesmo visual, numerados ("2/5"), para postar juntos. */
export function CarouselStudio() {
  const [base, setBase] = useState<ArtSpec>(() => artSpecSchema.parse({ format: "feed", theme: "papel" }));
  const [series, setSeries] = useState("ESTUDO");
  const [slides, setSlides] = useState<Slide[]>(START);
  const [previews, setPreviews] = useState<(string | null)[]>([]);
  const [rendering, setRendering] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const blobs = useRef<Blob[]>([]);
  const { text: content } = useContent();

  useEffect(() => {
    api<Preset[]>("/api/admin/art/presets").then(setPresets).catch(() => {});
  }, []);

  const specs = useMemo(
    () =>
      slides.map((s, i) =>
        artSpecSchema.parse({
          ...base,
          template: s.kind,
          tag: s.kind === "capa" ? "" : series,
          title: s.kind === "versiculo" ? "" : s.title,
          text: s.text,
          reference: s.reference,
          page: slides.length > 1 ? `${i + 1}/${slides.length}` : "",
          items: [],
          highlight: "",
          date: "",
          time: "",
          location: "",
        }),
      ),
    [base, series, slides],
  );

  // prévias: gera todas (uma de cada vez) pouco depois da última alteração
  const key = JSON.stringify(specs);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      setRendering(true);
      const urls: (string | null)[] = [];
      const got: Blob[] = [];
      try {
        for (const spec of specs) {
          const blob = await render(spec);
          if (!alive) return;
          got.push(blob);
          urls.push(URL.createObjectURL(blob));
        }
        blobs.current = got;
        setPreviews((old) => {
          old.forEach((u) => u && URL.revokeObjectURL(u));
          return urls;
        });
      } catch (err) {
        if (alive) toast.error(err instanceof Error ? err.message : "Erro ao gerar o carrossel");
      } finally {
        if (alive) setRendering(false);
      }
    }, 800);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = (i: number, patch: Partial<Slide>) => setSlides((l) => l.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, d: -1 | 1) =>
    setSlides((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const c = [...l];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const name = (i: number) =>
    `${(slides[0]?.title || "carrossel")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()}-${String(i + 1).padStart(2, "0")}.jpg`;

  const downloadAll = async () => {
    for (let i = 0; i < previews.length; i++) {
      const a = document.createElement("a");
      a.href = previews[i]!;
      a.download = name(i);
      a.click();
      await new Promise((r) => setTimeout(r, 400));
    }
  };
  const canShare = typeof navigator !== "undefined" && "canShare" in navigator;
  const shareAll = async () => {
    const files = blobs.current.map((b, i) => new File([b], name(i), { type: "image/jpeg" }));
    if (navigator.canShare?.({ files })) {
      try {
        await navigator.share({ files });
      } catch {
        /* cancelado */
      }
    } else downloadAll();
  };

  const captions = useMemo(
    () => {
      const cover = slides.find((x) => x.kind === "capa")?.title ?? "";
      return carouselCaptions(cover === START[0].title ? "" : cover, { hashtags: content("social_hashtags") });
    },
    [slides, content],
  );
  const caption = useCaption(captions);
  const [publishOpen, setPublishOpen] = useState(false);

  const fmt = ART_FORMATS[base.format];
  return (
    <div className="grid lg:grid-cols-[minmax(320px,420px)_1fr] gap-4 items-start">
      <Card>
        <CardContent className="p-4 space-y-4">
          {presets.length > 0 && (
            <div className="space-y-1.5">
              <Label>Visual de um modelo salvo (opcional)</Label>
              <Select
                onValueChange={(id) => {
                  const p = presets.find((x) => x.id === id);
                  if (p) setBase(artSpecSchema.parse({ ...p.spec, format: p.spec.format === "story" ? "feed" : p.spec.format }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Usar as cores e o fundo de um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Formato</Label>
              <Select value={base.format} onValueChange={(f) => setBase({ ...base, format: f as ArtFormat })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["feed", "square"] as ArtFormat[]).map((f) => (
                    <SelectItem key={f} value={f}>
                      {ART_FORMATS[f].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cores</Label>
              <Select value={base.theme} onValueChange={(t) => setBase({ ...base, theme: t as ArtThemeId, background: "cor", photo: null })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ART_THEMES) as ArtThemeId[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {ART_THEMES[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="car-series">Etiqueta dos slides</Label>
            <Input id="car-series" value={series} maxLength={40} onChange={(e) => setSeries(e.target.value)} placeholder="Ex.: ESTUDO, SÉRIE FAMÍLIA" />
          </div>

          <div className="space-y-3 border-t pt-4">
            {slides.map((s, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground w-6">{i + 1}</span>
                  <Select value={s.kind} onValueChange={(k) => update(i, { kind: k as SlideKind })}>
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(KIND_LABEL) as SlideKind[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {KIND_LABEL[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="ml-auto flex">
                    <Button type="button" variant="ghost" size="icon" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" disabled={i === slides.length - 1} onClick={() => move(i, 1)} aria-label="Descer">
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      disabled={slides.length <= 1}
                      onClick={() => setSlides((l) => l.filter((_, j) => j !== i))}
                      aria-label="Tirar slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {s.kind !== "versiculo" && <Input value={s.title} maxLength={140} onChange={(e) => update(i, { title: e.target.value })} placeholder="Título" aria-label={`Título do slide ${i + 1}`} />}
                <Textarea
                  rows={s.kind === "capa" ? 1 : 3}
                  value={s.text}
                  maxLength={600}
                  onChange={(e) => update(i, { text: e.target.value })}
                  placeholder={s.kind === "capa" ? "Subtítulo (opcional)" : s.kind === "versiculo" ? "Versículo" : "Texto"}
                  aria-label={`Texto do slide ${i + 1}`}
                />
                {s.kind === "versiculo" && <Input value={s.reference} maxLength={80} onChange={(e) => update(i, { reference: e.target.value })} placeholder="Referência (ex.: João 3:16)" />}
              </div>
            ))}
            {slides.length < 10 && (
              <Button type="button" variant="outline" className="w-full gap-2" onClick={() => setSlides((l) => [...l, { kind: "aviso", title: "", text: "", reference: "" }])}>
                <Plus className="w-4 h-4" /> Adicionar slide
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-3 order-first lg:order-none lg:sticky lg:top-20">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {slides.length} slides · {fmt.label}
          {rendering && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
          {slides.map((_, i) => (
            <div key={i} className="snap-start shrink-0 w-56 sm:w-64">
              <div className={cn("rounded-lg border bg-muted overflow-hidden")} style={{ aspectRatio: `${fmt.width} / ${fmt.height}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {previews[i] && <img src={previews[i]!} alt={`Slide ${i + 1}`} className="w-full h-full object-contain" />}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button onClick={downloadAll} disabled={rendering || previews.length !== slides.length} className="gap-2">
            <Download className="w-4 h-4" /> Baixar todos
          </Button>
          {canShare && (
            <Button variant="outline" onClick={shareAll} disabled={rendering || previews.length !== slides.length} className="gap-2">
              <Share2 className="w-4 h-4" /> Compartilhar
            </Button>
          )}
          <Button variant="outline" onClick={() => setPublishOpen(true)} disabled={rendering || previews.length !== slides.length} className="gap-2">
            <Send className="w-4 h-4" /> Publicar nas redes
          </Button>
          <PublishDialog
            key={publishOpen ? "aberto" : "fechado"}
            open={publishOpen}
            onOpenChange={setPublishOpen}
            title={slides[0]?.title || "Carrossel"}
            specs={specs}
            caption={caption.text}
          />
        </div>
        <CaptionBox caption={caption} />
        {previews.length === slides.length && previews.every(Boolean) && (
          <PostPreview images={previews} ratio={fmt.width / fmt.height} caption={caption.text} />
        )}
      </div>
    </div>
  );
}
