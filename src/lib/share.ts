// Textos e links de compartilhamento. Cada item aponta para a sua própria página (com preview
// próprio no WhatsApp/Facebook), e a mensagem já vem formatada para o WhatsApp (*negrito*).
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ShareData {
  /** Título curto (usado pelo compartilhamento nativo do celular) */
  title: string;
  /** Mensagem completa, sem o link (o link é acrescentado no final) */
  text: string;
  /** Link absoluto da página do item */
  url: string;
}

const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://imensageiradedeus.com.br").replace(/\/$/, "");
const abs = (path: string) => `${ORIGIN}${path}`;
const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);
const SIGNATURE = "Igreja Mensageira De Deus Templo De Fé";

export function shareEvent(e: { id: string; title: string; event_date: string; location?: string | null; description?: string | null }): ShareData {
  const d = new Date(e.event_date);
  const when = format(d, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  const lines = [
    `📅 *${e.title}*`,
    `🗓️ ${when.charAt(0).toUpperCase()}${when.slice(1)}`,
    e.location ? `📍 ${e.location}` : null,
    e.description ? `\n${clip(e.description, 220)}` : null,
    `\nVenha participar! 🙏`,
  ].filter(Boolean);
  return { title: e.title, text: lines.join("\n"), url: abs(`/eventos/${e.id}`) };
}

/** Programação fixa (ex.: "Culto de Cura e Libertação — toda sexta às 20:00"). */
export function shareSchedule(s: { title: string; date: string; time: string; description?: string | null }): ShareData {
  const lines = [`📅 *${s.title}*`, `🗓️ ${s.date} às ${s.time}`, s.description ? `\n${clip(s.description, 220)}` : null, `\nVenha participar! 🙏`].filter(Boolean);
  return { title: s.title, text: lines.join("\n"), url: abs("/eventos") };
}

export function shareVerse(v: { id: string; verse_text: string; verse_reference: string }): ShareData {
  return {
    title: `Palavra do Dia — ${v.verse_reference}`,
    text: `📖 *Palavra do Dia*\n\n“${v.verse_text}”\n— *${v.verse_reference}*`,
    url: abs(`/palavra/${v.id}`),
  };
}

export function sharePhoto(p: { albumId: string; photoId: string; albumName?: string | null; albumDate?: string | null }): ShareData {
  const where = [p.albumName, p.albumDate].filter(Boolean).join(" • ");
  return {
    title: "Foto — Mensageira de Deus",
    text: `📸 *Foto da galeria*${where ? `\n${where}` : ""}`,
    url: abs(`/galeria/foto/${p.albumId}/${p.photoId}`),
  };
}

export function shareTestimony(t: { id: string; name: string; content: string; title?: string | null }): ShareData {
  return {
    title: `Testemunho de ${t.name}`,
    text: `✨ *Testemunho${t.title ? `: ${t.title}` : ""}*\n\n“${clip(t.content, 260)}”\n— ${t.name}`,
    url: abs(`/testemunhos/${t.id}`),
  };
}

/** Mensagem final enviada (texto + link + assinatura). */
export function shareMessage(d: ShareData) {
  return `${d.text}\n\n👉 ${d.url}\n\n_${SIGNATURE}_`;
}
