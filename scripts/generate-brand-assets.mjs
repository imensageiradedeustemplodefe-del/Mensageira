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
const W = 1200;
const H = 630;
const background = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1E90FF"/>
      <stop offset="100%" stop-color="#0F5FBF"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="50%" r="45%">
      <stop offset="0%" stop-color="#FFD700" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#FFD700" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g font-family="Roboto, Arial, Helvetica, sans-serif" fill="#ffffff">
    <text x="600" y="255" font-size="64" font-weight="700">Mensageira de Deus</text>
    <text x="600" y="330" font-size="48" font-weight="500" fill="#FFD700">Templo de Fé</text>
    <text x="600" y="400" font-size="26" fill="#EAF4FF">Uma igreja comprometida com a Palavra de Deus</text>
    <text x="600" y="446" font-size="26" fill="#EAF4FF">Cultos, eventos, orações e transmissões ao vivo</text>
    <text x="600" y="530" font-size="24" fill="#FFD700" font-weight="500">imensageiradedeus.com.br</text>
  </g>
</svg>`);

const logo = await sharp(LOGO).resize(420, 420).png().toBuffer();
await sharp(background)
  .composite([{ input: logo, left: 110, top: 105 }])
  .jpeg({ quality: 90 })
  .toFile("public/og-image.jpg");

console.log("✔ favicon.ico, icon.png, apple-icon.png, public/icons/*, public/og-image.jpg");
