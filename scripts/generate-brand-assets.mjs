// Gera favicon (ICO/PNG), ícones do PWA e a imagem Open Graph a partir do logo.
// Uso: node scripts/generate-brand-assets.mjs
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFile, mkdir } from "node:fs/promises";

const LOGO = "public/images/logo-icon.png";

await mkdir("src/app", { recursive: true });
await mkdir("public/icons", { recursive: true });

// ---- Favicons / ícones ----
const png = (size) => sharp(LOGO).resize(size, size).png().toBuffer();

await writeFile("src/app/icon.png", await png(192));
await writeFile("src/app/apple-icon.png", await png(180));
for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) {
  await writeFile(`public/icons/icon-${size}.png`, await png(size));
}
const ico = await pngToIco([await png(16), await png(32), await png(48)]);
await writeFile("src/app/favicon.ico", ico);
await writeFile("public/favicon.ico", ico);

// ---- Open Graph (1200x630) ----
// Composição centralizada: fica boa no banner largo (Facebook, WhatsApp com link no início)
// e também quando o WhatsApp recorta o quadrado central (link no meio do texto).
const W = 1200;
const H = 630;
const background = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2A9BFF"/>
      <stop offset="100%" stop-color="#0D57B5"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="40%">
      <stop offset="0%" stop-color="#FFD700" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#FFD700" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <!-- raios suaves atrás do logo -->
  <g stroke="#ffffff" stroke-opacity="0.08" stroke-width="40">
    <line x1="600" y1="215" x2="600" y2="-200"/>
    <line x1="600" y1="215" x2="1000" y2="-100"/>
    <line x1="600" y1="215" x2="200" y2="-100"/>
    <line x1="600" y1="215" x2="1150" y2="150"/>
    <line x1="600" y1="215" x2="50" y2="150"/>
  </g>
  <g font-family="Roboto, Arial, Helvetica, sans-serif" fill="#ffffff" text-anchor="middle">
    <text x="600" y="470" font-size="62" font-weight="700">Mensageira de Deus</text>
    <text x="600" y="530" font-size="40" font-weight="500" fill="#FFD700">Templo de Fé</text>
    <text x="600" y="590" font-size="24" fill="#EAF4FF">Igreja Evangélica em Caçador - SC  •  imensageiradedeus.com.br</text>
  </g>
</svg>`);

const LOGO_SIZE = 350;
const logo = await sharp(LOGO).resize(LOGO_SIZE, LOGO_SIZE).png().toBuffer();
// aro branco atrás do logo
const ring = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><circle cx="600" cy="215" r="${LOGO_SIZE / 2 + 10}" fill="#ffffff" fill-opacity="0.95"/></svg>`);
await sharp(background)
  .composite([
    { input: ring, left: 0, top: 0 },
    { input: logo, left: Math.round(600 - LOGO_SIZE / 2), top: Math.round(215 - LOGO_SIZE / 2) },
  ])
  .jpeg({ quality: 88, progressive: false })
  .toFile("public/og-image.jpg");

console.log("✔ favicon.ico, icon.png, apple-icon.png, public/icons/*, public/og-image.jpg");
