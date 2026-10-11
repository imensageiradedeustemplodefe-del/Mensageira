// Imagens de preview (Open Graph) geradas por código para os links compartilhados
// (WhatsApp, Facebook...). Cada página de detalhe (evento, versículo, foto, testemunho) tem a sua.
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BLUE_FROM = "#2A9BFF";
const BLUE_TO = "#0D57B5";
const GOLD = "#FFD700";

let assets: Promise<{ regular: Buffer; bold: Buffer; logo: string }> | null = null;
function loadAssets() {
  assets ??= (async () => {
    const [regular, bold, logo] = await Promise.all([
      readFile(join(process.cwd(), "assets/fonts/Roboto-Regular.woff")),
      readFile(join(process.cwd(), "assets/fonts/Roboto-Bold.woff")),
      readFile(join(process.cwd(), "public/images/logo-icon.png")),
    ]);
    return { regular, bold, logo: `data:image/png;base64,${logo.toString("base64")}` };
  })();
  return assets;
}

export async function ogResponse(node: (logo: string) => React.ReactElement) {
  const { regular, bold, logo } = await loadAssets();
  return new ImageResponse(node(logo), {
    ...OG_SIZE,
    fonts: [
      { name: "Roboto", data: regular, weight: 400, style: "normal" },
      { name: "Roboto", data: bold, weight: 700, style: "normal" },
    ],
  });
}

const clamp = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

/**
 * Cartão padrão: faixa superior com "etiqueta" (ex.: 📅 EVENTO), título grande, linhas de detalhe
 * e rodapé com o logo e o nome da igreja.
 */
export function OgCard({
  logo,
  label,
  title,
  lines = [],
  quote = false,
}: {
  logo: string;
  label: string;
  title: string;
  lines?: string[];
  quote?: boolean;
}) {
  const t = clamp(title, quote ? 230 : 70);
  const titleSize = quote ? (t.length > 170 ? 34 : t.length > 110 ? 40 : 48) : t.length > 40 ? 60 : 72;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px",
        backgroundImage: `linear-gradient(135deg, ${BLUE_FROM}, ${BLUE_TO})`,
        color: "#ffffff",
        fontFamily: "Roboto",
      }}
    >
      <div style={{ display: "flex" }}>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 2,
            color: BLUE_TO,
            background: GOLD,
            padding: "8px 20px",
            borderRadius: 999,
          }}
        >
          {label}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            display: "flex",
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.15,
            fontStyle: "normal",
          }}
        >
          {quote ? `“${t}”` : t}
        </div>
        {lines.map((l, i) => (
          <div key={i} style={{ display: "flex", fontSize: quote ? 34 : 34, color: i === 0 && quote ? GOLD : "#E3F0FF", fontWeight: i === 0 && quote ? 700 : 400 }}>
            {clamp(l, 60)}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={84} height={84} style={{ borderRadius: 999, background: "#fff", border: "4px solid #fff" }} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>Igreja Mensageira De Deus Templo De Fé</div>
          <div style={{ display: "flex", fontSize: 24, color: GOLD }}>imensageiradedeus.com.br</div>
        </div>
      </div>
    </div>
  );
}

/** Baixa a miniatura de um arquivo do Drive como data URL (null se não for imagem ou falhar). */
export async function drivePhotoDataUrl(fileId: string) {
  try {
    const res = await fetch(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`, { redirect: "follow" });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Foto ocupando o cartão todo, com faixa inferior com o logo, o nome da igreja e a legenda. */
export function OgPhoto({ logo, photo, caption }: { logo: string; photo: string; caption?: string }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: BLUE_TO, fontFamily: "Roboto" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} width={1200} height={630} style={{ width: 1200, height: 630, objectFit: "cover", objectPosition: "50% 30%" }} alt="" />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "26px 36px",
          backgroundImage: "linear-gradient(to top, rgba(8,40,90,0.95), rgba(8,40,90,0.75) 60%, rgba(8,40,90,0))",
          color: "#fff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={64} height={64} style={{ borderRadius: 999, background: "#fff", border: "3px solid #fff" }} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700 }}>Igreja Mensageira De Deus Templo De Fé</div>
          {caption && <div style={{ display: "flex", fontSize: 24, color: GOLD }}>{caption}</div>}
        </div>
      </div>
    </div>
  );
}
