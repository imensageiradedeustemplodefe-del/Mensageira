// Gera os ícones de notificação (pomba) e o ícone maskable do PWA (splash do Android).
// Uso: node scripts/generate-notification-assets.mjs
import sharp from "sharp";

const BLUE = "#1E90FF";

// Silhueta de pomba em voo (viewBox 0 0 100 100), composta por formas simples
const doveShapes = (fill) => `
  <g fill="${fill}">
    <polygon points="12,66 32,60 30,76 16,80"/>
    <ellipse cx="50" cy="58" rx="25" ry="13" transform="rotate(-12 50 58)"/>
    <ellipse cx="48" cy="40" rx="9" ry="24" transform="rotate(28 48 40)"/>
    <ellipse cx="60" cy="34" rx="7" ry="19" transform="rotate(38 60 34)"/>
    <circle cx="74" cy="46" r="9.5"/>
    <polygon points="82,44 93,48 82,50"/>
    <path d="M 66 70 q 10 8 22 4" stroke="${fill}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="80" cy="73" rx="3.2" ry="1.8" transform="rotate(-20 80 73)"/>
    <ellipse cx="74" cy="71" rx="3" ry="1.7" transform="rotate(-30 74 71)"/>
  </g>
  <circle cx="76" cy="44" r="1.7" fill="${fill === "#ffffff" ? BLUE : "#ffffff"}"/>`;

const doveSvg = (fill, size, bg) =>
  Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  ${bg ? `<circle cx="50" cy="50" r="50" fill="${bg}"/>` : ""}
  <g transform="translate(50 50) scale(0.74) translate(-50 -50)">${doveShapes(fill)}</g>
</svg>`);

// Ícone da notificação (colorido): pomba branca sobre azul
await sharp(doveSvg("#ffffff", 192, BLUE)).png().toFile("public/icons/notification-192.png");
await sharp(doveSvg("#ffffff", 512, BLUE)).png().toFile("public/icons/notification-512.png");
// Badge (Android): monocromático, branco sobre transparente
await sharp(doveSvg("#ffffff", 96, null)).png().toFile("public/icons/badge-96.png");

// Ícone maskable do PWA: logo com margem de segurança (zona segura = 80% central) sobre o azul da marca
const LOGO = "public/images/logo-icon.png";
for (const size of [192, 512]) {
  const inner = Math.round(size * 0.62);
  const logo = await sharp(LOGO).resize(inner, inner).png().toBuffer();
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${BLUE}"/></svg>`
  );
  await sharp(bg)
    .composite([{ input: logo, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }])
    .png()
    .toFile(`public/icons/maskable-${size}.png`);
}

console.log("✔ notification-192/512.png, badge-96.png, maskable-192/512.png");
