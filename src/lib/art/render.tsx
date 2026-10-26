// Desenho das artes (feed, story, capa) com next/og: o servidor gera a imagem; sharp converte para JPEG,
// que é o que o Instagram aceita. Só roda no servidor.
// Estilo minimalista: muito espaço, título em serifa fina, detalhes pequenos em maiúsculas espaçadas e linhas finas.
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { ART_FORMATS, ART_THEMES, type ArtSpec } from "@/lib/art/spec";

type Font = { name: string; data: Buffer; weight: 500 | 600 | 700 | 800; style: "normal" | "italic" };
let assets: Promise<{ fonts: Font[]; logo: string }> | null = null;
function loadAssets() {
  assets ??= (async () => {
    const dir = join(process.cwd(), "assets/fonts");
    const [m500, m700, pItalic, pNormal, logo] = await Promise.all([
      readFile(join(dir, "montserrat-latin-500-normal.woff")),
      readFile(join(dir, "montserrat-latin-700-normal.woff")),
      readFile(join(dir, "playfair-display-latin-600-italic.woff")),
      readFile(join(dir, "playfair-display-latin-500-normal.woff")),
      readFile(join(process.cwd(), "public/images/logo-icon.png")),
    ]);
    const fonts: Font[] = [
      { name: "Montserrat", data: m500, weight: 500, style: "normal" },
      { name: "Montserrat", data: m700, weight: 700, style: "normal" },
      { name: "Playfair", data: pItalic, weight: 600, style: "italic" },
      { name: "Playfair", data: pNormal, weight: 500, style: "normal" },
    ];
    return { fonts, logo: `data:image/png;base64,${logo.toString("base64")}` };
  })();
  return assets;
}

/** Foto recortada no tamanho pedido, centrada no ponto escolhido (x, y em %). */
async function cropPhoto(photo: NonNullable<ArtSpec["photo"]>, width: number, height: number) {
  let input: Buffer | null = null;
  const id = photo.url.match(/^\/api\/images\/([0-9a-f-]{36})$/i)?.[1];
  if (id) {
    const img = await prisma.siteImage.findUnique({ where: { id }, select: { data: true } });
    input = img ? Buffer.from(img.data) : null;
  } else if (/^\/images\/[a-z0-9._-]+$/i.test(photo.url)) {
    input = await readFile(join(process.cwd(), "public", photo.url)).catch(() => null);
  }
  if (!input) return null;
  const rotated = await sharp(input).rotate().toBuffer();
  const meta = await sharp(rotated).metadata();
  const w = meta.width ?? width;
  const h = meta.height ?? height;
  const ratio = width / height;
  const cw = w / h > ratio ? Math.round(h * ratio) : w;
  const ch = w / h > ratio ? h : Math.round(w / ratio);
  const left = Math.min(Math.max(Math.round((photo.x / 100) * w - cw / 2), 0), w - cw);
  const top = Math.min(Math.max(Math.round((photo.y / 100) * h - ch / 2), 0), h - ch);
  const out = await sharp(rotated).extract({ left, top, width: cw, height: ch }).resize(width, height).jpeg({ quality: 88 }).toBuffer();
  return `data:image/jpeg;base64,${out.toString("base64")}`;
}

/** "#RRGGBB" + opacidade → rgba */
function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const upper = (s: string) => s.toLocaleUpperCase("pt-BR");

function titleSize(t: string, story: boolean) {
  const n = t.length;
  const base = n <= 14 ? 118 : n <= 24 ? 100 : n <= 36 ? 86 : n <= 55 ? 72 : n <= 85 ? 60 : 50;
  return story ? Math.round(base * 1.1) : base;
}

type Colors = { text: string; muted: string; accent: string };

function Body({ spec, c, center }: { spec: ArtSpec; c: Colors; center: boolean }) {
  const story = spec.format === "story";
  const align = center ? "center" : "flex-start";
  const textAlign = center ? "center" : "left";
  const rule = <div style={{ display: "flex", width: 90, height: 2, background: c.accent }} />;

  if (spec.template === "versiculo") {
    const t = spec.text;
    const size = t.length <= 90 ? 62 : t.length <= 160 ? 54 : t.length <= 260 ? 46 : 38;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: align, gap: 44 }}>
        {rule}
        <div
          style={{
            display: "flex",
            fontFamily: "Playfair",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: story ? size + 6 : size,
            lineHeight: 1.45,
            color: c.text,
            textAlign,
            justifyContent: align,
          }}
        >
          {t}
        </div>
        {spec.reference && <div style={{ display: "flex", fontSize: 30, fontWeight: 500, letterSpacing: 5, color: c.accent }}>{upper(spec.reference)}</div>}
        {rule}
      </div>
    );
  }

  const details = spec.template === "evento" ? [[spec.date, spec.time].filter(Boolean).join("  ·  "), spec.location].filter(Boolean) : [];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align, gap: 40 }}>
      <div
        style={{
          display: "flex",
          fontFamily: "Playfair",
          fontWeight: 500,
          fontSize: titleSize(spec.title, story),
          lineHeight: 1.08,
          color: c.text,
          textAlign,
          justifyContent: align,
        }}
      >
        {spec.title}
      </div>
      {rule}
      {(spec.template === "aviso" || spec.template === "capa") && spec.text && (
        <div
          style={{
            display: "flex",
            fontSize: spec.template === "aviso" && spec.text.length > 220 ? 34 : 40,
            fontWeight: 500,
            lineHeight: 1.5,
            color: c.muted,
            textAlign,
            justifyContent: align,
          }}
        >
          {spec.text}
        </div>
      )}
      {details.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: align, gap: 16 }}>
          {details.map((d, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                fontSize: i === 0 ? 34 : 30,
                fontWeight: i === 0 ? 700 : 500,
                letterSpacing: 4,
                color: i === 0 ? c.text : c.muted,
                textAlign,
                justifyContent: align,
              }}
            >
              {upper(d)}
            </div>
          ))}
        </div>
      )}
      {spec.highlight && (
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 3,
            color: c.accent,
            border: `2px solid ${c.accent}`,
            padding: "14px 26px",
            borderRadius: 999,
          }}
        >
          {upper(spec.highlight)}
        </div>
      )}
    </div>
  );
}

/** Gera a arte em JPEG. */
export async function renderArt(spec: ArtSpec): Promise<Buffer> {
  const { width, height } = ART_FORMATS[spec.format];
  const theme = ART_THEMES[spec.theme];
  const { fonts, logo } = await loadAssets();
  const story = spec.format === "story";
  const pad = story ? 110 : 100;
  // story: deixa livres as faixas de cima e de baixo, onde o Instagram põe o perfil e a resposta
  const safeTop = story ? 150 : 0;
  const safeBottom = story ? 190 : 0;

  // sem foto = cor lisa; capa com "foto em cima" vira imagem de fundo (título sobre a foto)
  const bgMode = !spec.photo ? "cor" : spec.background === "foto" && spec.template === "capa" ? "imagem" : spec.background;
  const full = bgMode === "imagem";
  const photoH = bgMode === "foto" ? Math.round(height * (story ? 0.5 : spec.format === "square" ? 0.46 : 0.52)) : 0;
  const photo = spec.photo && bgMode !== "cor" ? await cropPhoto(spec.photo, width, full ? height : photoH) : null;

  // imagem de fundo: cores das letras escolhidas; senão, as do tema
  const c: Colors = full
    ? { text: spec.textColor, muted: alpha(spec.textColor, 0.85), accent: spec.accentColor }
    : { text: theme.text, muted: theme.muted, accent: theme.accent };
  const center = full ? spec.align === "center" : spec.template === "versiculo" || spec.template === "capa";
  const justify = !full ? "center" : spec.position === "topo" ? "flex-start" : spec.position === "base" ? "flex-end" : "center";
  const showLogo = full ? spec.showLogo : true;

  const tag = spec.tag ? (
    <div style={{ display: "flex", alignItems: "center", justifyContent: center && full ? "center" : "flex-start", gap: 18 }}>
      <div style={{ display: "flex", width: 40, height: 2, background: c.accent }} />
      <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 7, color: c.accent }}>{upper(spec.tag)}</div>
    </div>
  ) : null;
  const footer = showLogo ? (
    <div style={{ display: "flex", alignItems: "center", justifyContent: center ? "center" : "flex-start", gap: 18 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} width={64} height={64} alt="" style={{ borderRadius: 999, background: "#fff" }} />
      <div style={{ display: "flex", fontSize: 24, fontWeight: 500, letterSpacing: 4, color: c.muted }}>{upper("Igreja Mensageira de Deus")}</div>
    </div>
  ) : (
    <div style={{ display: "flex" }} />
  );
  // cor lisa: etiqueta no alto; com foto em cima ou imagem de fundo: junto do texto
  const tagOnTop = !photoH && !full;

  const node = (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Montserrat", background: theme.bg, color: c.text }}>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} width={width} height={full ? height : photoH} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
      )}
      {full && photo && spec.overlay > 0 && (
        <div style={{ position: "absolute", top: 0, left: 0, width, height, display: "flex", background: `rgba(0,0,0,${spec.overlay / 100})` }} />
      )}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: `${photoH ? photoH + 70 : pad + safeTop}px ${pad}px ${pad + safeBottom}px`,
        }}
      >
        {tagOnTop ? tag ?? <div style={{ display: "flex" }} /> : null}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: photoH ? "flex-start" : justify, gap: 36, padding: photoH ? "0" : "40px 0" }}>
          {!tagOnTop && tag}
          <Body spec={spec} c={c} center={center} />
        </div>
        {footer}
      </div>
    </div>
  );

  const png = new ImageResponse(node, { width, height, fonts });
  return sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 92 }).toBuffer();
}
