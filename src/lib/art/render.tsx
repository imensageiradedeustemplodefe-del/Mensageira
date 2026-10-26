// Desenho das artes (feed, story, capa) com next/og: o servidor gera a imagem; sharp converte para JPEG,
// que é o que o Instagram aceita. Só roda no servidor.
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { ART_FORMATS, ART_THEMES, type ArtSpec, type ArtTheme } from "@/lib/art/spec";

const SITE = "imensageiradedeus.com.br";

let assets: Promise<{ fonts: { name: string; data: Buffer; weight: 500 | 600 | 700 | 800; style: "normal" | "italic" }[]; logo: string }> | null =
  null;
function loadAssets() {
  assets ??= (async () => {
    const dir = join(process.cwd(), "assets/fonts");
    const [m500, m700, m800, pItalic, pNormal, logo] = await Promise.all([
      readFile(join(dir, "montserrat-latin-500-normal.woff")),
      readFile(join(dir, "montserrat-latin-700-normal.woff")),
      readFile(join(dir, "montserrat-latin-800-normal.woff")),
      readFile(join(dir, "playfair-display-latin-600-italic.woff")),
      readFile(join(dir, "playfair-display-latin-500-normal.woff")),
      readFile(join(process.cwd(), "public/images/logo-icon.png")),
    ]);
    return {
      fonts: [
        { name: "Montserrat", data: m500, weight: 500, style: "normal" },
        { name: "Montserrat", data: m700, weight: 700, style: "normal" },
        { name: "Montserrat", data: m800, weight: 800, style: "normal" },
        { name: "Playfair", data: pItalic, weight: 600, style: "italic" },
        { name: "Playfair", data: pNormal, weight: 500, style: "normal" },
      ],
      logo: `data:image/png;base64,${logo.toString("base64")}`,
    };
  })();
  return assets;
}

/** Foto de fundo recortada no tamanho da arte, centrada no ponto escolhido (x, y em %). */
async function backgroundPhoto(photo: NonNullable<ArtSpec["photo"]>, width: number, height: number) {
  let input: Buffer | null = null;
  const id = photo.url.match(/^\/api\/images\/([0-9a-f-]{36})$/i)?.[1];
  if (id) {
    const img = await prisma.siteImage.findUnique({ where: { id }, select: { data: true } });
    input = img ? Buffer.from(img.data) : null;
  } else if (/^\/images\/[a-z0-9._-]+$/i.test(photo.url)) {
    input = await readFile(join(process.cwd(), "public", photo.url)).catch(() => null);
  }
  if (!input) return null;
  const meta = await sharp(input).metadata();
  const w = meta.width ?? width;
  const h = meta.height ?? height;
  const ratio = width / height;
  const cw = w / h > ratio ? Math.round(h * ratio) : w;
  const ch = w / h > ratio ? h : Math.round(w / ratio);
  const left = Math.min(Math.max(Math.round((photo.x / 100) * w - cw / 2), 0), w - cw);
  const top = Math.min(Math.max(Math.round((photo.y / 100) * h - ch / 2), 0), h - ch);
  const out = await sharp(input).rotate().extract({ left, top, width: cw, height: ch }).resize(width, height).jpeg({ quality: 85 }).toBuffer();
  return `data:image/jpeg;base64,${out.toString("base64")}`;
}

/** Tamanho do título conforme o comprimento (sempre cabe em até ~4 linhas). */
function titleSize(t: string, big = false) {
  const n = t.length;
  const base = n <= 14 ? 120 : n <= 24 ? 104 : n <= 36 ? 88 : n <= 55 ? 74 : n <= 85 ? 62 : 52;
  return big ? Math.round(base * 1.15) : base;
}

const Icon = ({ d, color }: { d: string; color: string }) => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ICONS = {
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  pin: "M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
};

function Tag({ text, theme }: { text: string; theme: ArtTheme }) {
  if (!text) return null;
  return (
    <div style={{ display: "flex" }}>
      <div
        style={{
          display: "flex",
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: 4,
          color: theme.onAccent,
          background: theme.accent,
          padding: "12px 30px",
          borderRadius: 999,
        }}
      >
        {text.toUpperCase()}
      </div>
    </div>
  );
}

function Footer({ logo, theme }: { logo: string; theme: ArtTheme }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} width={104} height={104} alt="" style={{ borderRadius: 999, background: "#fff", border: `5px solid ${theme.accent}` }} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: theme.text }}>Igreja Mensageira de Deus</div>
        <div style={{ display: "flex", fontSize: 28, fontWeight: 500, color: theme.muted }}>Templo de Fé • {SITE}</div>
      </div>
    </div>
  );
}

function Body({ spec, theme }: { spec: ArtSpec; theme: ArtTheme }) {
  const story = spec.format === "story";
  if (spec.template === "versiculo") {
    const t = spec.text;
    const size = t.length <= 90 ? 64 : t.length <= 160 ? 56 : t.length <= 260 ? 48 : 40;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", fontFamily: "Playfair", fontStyle: "italic", fontSize: 200, lineHeight: 0.6, color: theme.accent, height: 110 }}>“</div>
        <div style={{ display: "flex", fontFamily: "Playfair", fontStyle: "italic", fontWeight: 600, fontSize: story ? size + 6 : size, lineHeight: 1.35, color: theme.text }}>
          {t}
        </div>
        {spec.reference && <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: theme.accent, letterSpacing: 1 }}>{spec.reference}</div>}
      </div>
    );
  }
  if (spec.template === "capa") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 28 }}>
        <div style={{ display: "flex", fontSize: titleSize(spec.title, true), fontWeight: 800, lineHeight: 1.05, color: theme.text, textAlign: "center", justifyContent: "center" }}>
          {spec.title}
        </div>
        {spec.text && (
          <div style={{ display: "flex", fontSize: 46, fontWeight: 500, color: theme.muted, textAlign: "center", justifyContent: "center", lineHeight: 1.3 }}>
            {spec.text}
          </div>
        )}
        <div style={{ display: "flex", width: 160, height: 10, borderRadius: 999, background: theme.accent }} />
      </div>
    );
  }
  const rows = spec.template === "evento" ? ([["calendar", spec.date], ["clock", spec.time], ["pin", spec.location]] as const).filter(([, v]) => v) : [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <div style={{ display: "flex", fontSize: titleSize(spec.title), fontWeight: 800, lineHeight: 1.05, color: theme.text }}>{spec.title}</div>
      <div style={{ display: "flex", width: 140, height: 10, borderRadius: 999, background: theme.accent }} />
      {spec.template === "aviso" && spec.text && (
        <div style={{ display: "flex", fontSize: spec.text.length > 220 ? 38 : 46, fontWeight: 500, lineHeight: 1.4, color: theme.muted }}>{spec.text}</div>
      )}
      {rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {rows.map(([icon, value]) => (
            <div key={icon} style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Icon d={ICONS[icon]} color={theme.accent} />
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: theme.text }}>{value}</div>
            </div>
          ))}
        </div>
      )}
      {spec.highlight && (
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              fontSize: 38,
              fontWeight: 800,
              color: theme.onAccent,
              background: theme.accent,
              padding: "16px 30px",
              borderRadius: 20,
            }}
          >
            {spec.highlight}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Estilo minimalista ----------------
// Fundo liso, muito espaço, título em serifa fina, detalhes pequenos com letras espaçadas e linhas finas.

const upper = (s: string) => s.toLocaleUpperCase("pt-BR");

function minimalTitleSize(t: string, story: boolean) {
  const n = t.length;
  const base = n <= 14 ? 118 : n <= 24 ? 100 : n <= 36 ? 86 : n <= 55 ? 72 : n <= 85 ? 60 : 50;
  return story ? Math.round(base * 1.1) : base;
}

function MinimalBody({ spec, theme, center }: { spec: ArtSpec; theme: ArtTheme; center: boolean }) {
  const story = spec.format === "story";
  const align = center ? "center" : "flex-start";
  const rule = <div style={{ display: "flex", width: 90, height: 2, background: theme.accent }} />;
  const small = (t: string, color = theme.muted) => (
    <div style={{ display: "flex", fontSize: 30, fontWeight: 500, letterSpacing: 5, color, textAlign: center ? "center" : "left", justifyContent: align }}>{upper(t)}</div>
  );

  if (spec.template === "versiculo") {
    const t = spec.text;
    const size = t.length <= 90 ? 62 : t.length <= 160 ? 54 : t.length <= 260 ? 46 : 38;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 44 }}>
        {rule}
        <div
          style={{
            display: "flex",
            fontFamily: "Playfair",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: story ? size + 6 : size,
            lineHeight: 1.45,
            color: theme.text,
            textAlign: "center",
            justifyContent: "center",
          }}
        >
          {t}
        </div>
        {spec.reference && small(spec.reference, theme.accent)}
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
          fontSize: minimalTitleSize(spec.title, story),
          lineHeight: 1.08,
          color: theme.text,
          textAlign: center ? "center" : "left",
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
            fontSize: spec.template === "capa" ? 40 : spec.text.length > 220 ? 34 : 40,
            fontWeight: 500,
            lineHeight: 1.5,
            color: theme.muted,
            textAlign: center ? "center" : "left",
            justifyContent: align,
          }}
        >
          {spec.text}
        </div>
      )}
      {details.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: align, gap: 16 }}>
          {details.map((d, i) => (
            <div key={i} style={{ display: "flex", fontSize: i === 0 ? 34 : 30, fontWeight: i === 0 ? 700 : 500, letterSpacing: 4, color: i === 0 ? theme.text : theme.muted }}>
              {upper(d)}
            </div>
          ))}
        </div>
      )}
      {spec.highlight && (
        <div style={{ display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: 3, color: theme.accent, border: `2px solid ${theme.accent}`, padding: "14px 26px", borderRadius: 999 }}>
          {upper(spec.highlight)}
        </div>
      )}
    </div>
  );
}

function minimalNode(spec: ArtSpec, theme: ArtTheme, logo: string, photo: string | null, width: number, height: number) {
  const story = spec.format === "story";
  const pad = story ? 110 : 100;
  const safeTop = story ? 150 : 0;
  const safeBottom = story ? 190 : 0;
  const center = spec.template === "versiculo" || spec.template === "capa";
  // com foto: a foto ocupa a parte de cima, limpa; o texto fica no bloco liso de baixo (capa: foto inteira, levemente escurecida)
  const fullPhoto = !!photo && spec.template === "capa";
  const photoH = photo && !fullPhoto ? Math.round(height * (story ? 0.5 : spec.format === "square" ? 0.46 : 0.52)) : 0;
  const fg = fullPhoto ? { ...theme, text: "#FFFFFF", muted: "#E6E6E6" } : theme;

  const tag = spec.tag ? (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ display: "flex", width: 40, height: 2, background: fg.accent }} />
      <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 7, color: fg.accent }}>{upper(spec.tag)}</div>
    </div>
  ) : (
    <div style={{ display: "flex" }} />
  );
  const footer = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: center ? "center" : "flex-start", gap: 18 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} width={64} height={64} alt="" style={{ borderRadius: 999, background: "#fff" }} />
      <div style={{ display: "flex", fontSize: 24, fontWeight: 500, letterSpacing: 4, color: fg.muted }}>{upper("Igreja Mensageira de Deus")}</div>
    </div>
  );

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative", fontFamily: "Montserrat", background: theme.from, color: fg.text }}>
      {photo && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} width={width} height={fullPhoto ? height : photoH} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
          {fullPhoto && <div style={{ position: "absolute", top: 0, left: 0, width, height, display: "flex", background: "rgba(0,0,0,0.42)" }} />}
        </>
      )}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: `${(photoH ? photoH + 70 : pad + safeTop)}px ${pad}px ${pad + safeBottom}px`,
        }}
      >
        {!photoH && tag}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: photoH ? "flex-start" : "center", gap: 36, padding: photoH ? "0" : "40px 0" }}>
          {photoH > 0 && tag}
          <MinimalBody spec={spec} theme={fg} center={center} />
        </div>
        {footer}
      </div>
    </div>
  );
}

/** Gera a arte em JPEG. */
export async function renderArt(spec: ArtSpec): Promise<Buffer> {
  const { width, height } = ART_FORMATS[spec.format];
  const theme = ART_THEMES[spec.theme];
  const { fonts, logo } = await loadAssets();
  const minimal = spec.style === "minimalista";
  const photoBox = minimal && spec.photo && spec.template !== "capa"
    ? { width, height: Math.round(height * (spec.format === "story" ? 0.5 : spec.format === "square" ? 0.46 : 0.52)) }
    : { width, height };
  const photo = spec.photo ? await backgroundPhoto(spec.photo, photoBox.width, photoBox.height) : null;
  if (minimal) {
    const png = new ImageResponse(minimalNode(spec, theme, logo, photo, width, height), { width, height, fonts });
    return sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 92 }).toBuffer();
  }
  const pad = spec.format === "story" ? 96 : 80;
  // story: deixa livres as faixas de cima e de baixo, onde o Instagram põe o perfil e a resposta
  const safeTop = spec.format === "story" ? 170 : 0;
  const safeBottom = spec.format === "story" ? 200 : 0;
  const centered = spec.template === "capa";

  const node = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        fontFamily: "Montserrat",
        color: theme.text,
        backgroundImage: `linear-gradient(150deg, ${theme.from}, ${theme.to})`,
      }}
    >
      {photo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} width={width} height={height} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width,
              height,
              display: "flex",
              backgroundImage: centered
                ? `linear-gradient(180deg, rgba(${theme.shade},0.55), rgba(${theme.shade},0.7))`
                : `linear-gradient(180deg, rgba(${theme.shade},0.15) 0%, rgba(${theme.shade},0.55) 38%, rgba(${theme.shade},0.92) 70%, rgba(${theme.shade},0.97) 100%)`,
            }}
          />
        </>
      ) : (
        <>
          {/* enfeites do fundo */}
          <div style={{ position: "absolute", display: "flex", width: 760, height: 760, borderRadius: 999, right: -260, top: -220, background: theme.accent, opacity: 0.14 }} />
          <div style={{ position: "absolute", display: "flex", width: 520, height: 520, borderRadius: 999, left: -200, bottom: -160, background: theme.text, opacity: 0.06 }} />
        </>
      )}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: `${pad + safeTop}px ${pad}px ${pad + safeBottom}px`,
        }}
      >
        <Tag text={spec.tag} theme={theme} />
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: photo && !centered ? "flex-end" : "center", padding: "40px 0" }}>
          <Body spec={spec} theme={theme} />
        </div>
        <Footer logo={logo} theme={theme} />
      </div>
    </div>
  );

  const png = new ImageResponse(node, { width, height, fonts });
  return sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 90 }).toBuffer();
}
