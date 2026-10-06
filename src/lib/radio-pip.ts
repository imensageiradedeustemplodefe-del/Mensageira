// Janela flutuante da rádio (Picture-in-Picture).
//
// Sites/PWAs não podem desenhar por cima de outros apps, mas o Android/Chrome permite uma janela
// Picture-in-Picture de um <video>. Desenhamos um "cartão" da rádio num <canvas>, transformamos em
// vídeo (captureStream) e abrimos esse vídeo em PiP. O áudio continua vindo do player normal; os
// botões tocar/pausar da janela usam o Media Session (configurado em AudioContext).

export interface RadioPipState {
  title: string;
  subtitle?: string | null;
  playing: boolean;
}

const W = 640;
const H = 360;

let video: HTMLVideoElement | null = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let logo: HTMLImageElement | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let state: RadioPipState = { title: "Rádio", playing: false };
let tick = 0;

export function isRadioPipSupported() {
  if (typeof document === "undefined") return false;
  return (
    "pictureInPictureEnabled" in document &&
    document.pictureInPictureEnabled &&
    typeof HTMLCanvasElement !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function"
  );
}

export function isRadioPipOpen() {
  return typeof document !== "undefined" && !!video && document.pictureInPictureElement === video;
}

function setup() {
  if (video) return;
  canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  ctx = canvas.getContext("2d");

  logo = new Image();
  logo.src = "/images/logo-icon.png";
  logo.onload = () => draw();

  video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("aria-hidden", "true");
  // precisa estar no documento, mas invisível
  Object.assign(video.style, { position: "fixed", width: "1px", height: "1px", opacity: "0", pointerEvents: "none", bottom: "0", left: "0" });
  document.body.appendChild(video);
  video.srcObject = canvas.captureStream(15);
  video.addEventListener("leavepictureinpicture", stopTimer);
}

function wrap(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function draw() {
  if (!ctx) return;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#2A9BFF");
  g.addColorStop(1, "#0D57B5");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // logo
  const size = 150;
  const lx = 50;
  const ly = (H - size) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(lx + size / 2, ly + size / 2, size / 2 + 6, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
  if (logo?.complete && logo.naturalWidth) ctx.drawImage(logo, lx, ly, size, size);

  // textos
  const tx = lx + size + 40;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px Roboto, Arial, sans-serif";
  ctx.fillText(wrap(state.title, 18), tx, 150);
  if (state.subtitle) {
    ctx.fillStyle = "#D6E9FF";
    ctx.font = "26px Roboto, Arial, sans-serif";
    ctx.fillText(wrap(state.subtitle, 26), tx, 192);
  }

  // indicador ao vivo / pausado (pulsa enquanto toca)
  const pulse = state.playing ? 0.55 + 0.45 * Math.abs(Math.sin(tick / 3)) : 1;
  ctx.globalAlpha = pulse;
  ctx.beginPath();
  ctx.arc(tx + 10, 240, 10, 0, Math.PI * 2);
  ctx.fillStyle = state.playing ? "#FF3B30" : "#B0C4DE";
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px Roboto, Arial, sans-serif";
  ctx.fillText(state.playing ? "AO VIVO" : "PAUSADO", tx + 30, 249);

  ctx.fillStyle = "#FFD700";
  ctx.font = "22px Roboto, Arial, sans-serif";
  ctx.fillText("Mensageira de Deus", tx, 305);
}

function startTimer() {
  stopTimer();
  // redesenha sempre: o stream do canvas só gera quadros quando há mudança
  timer = setInterval(() => {
    tick++;
    draw();
  }, 200);
}

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

/** Abre a janela flutuante. Precisa ser chamado a partir de um toque/clique do usuário. */
export async function openRadioPip(next: RadioPipState) {
  if (!isRadioPipSupported()) throw new Error("unsupported");
  setup();
  state = next;
  draw();
  startTimer();
  await video!.play();
  await video!.requestPictureInPicture();
}

export function updateRadioPip(next: RadioPipState) {
  state = next;
  if (!isRadioPipOpen() || !video) return;
  draw();
  // o vídeo acompanha o áudio: assim o botão da janela mostra tocar/pausar certo
  if (next.playing) {
    startTimer();
    video.play().catch(() => {});
  } else {
    stopTimer();
    video.pause();
  }
}

export async function closeRadioPip() {
  stopTimer();
  if (isRadioPipOpen()) await document.exitPictureInPicture().catch(() => {});
}
