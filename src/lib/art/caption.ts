// Legenda pronta para o post, montada a partir dos campos da arte (e do evento, quando escolhido).
import type { ArtSpec } from "@/lib/art/spec";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://imensageiradedeus.com.br").replace(/\/$/, "");

export function buildCaption(spec: ArtSpec, opts: { eventId?: string | null; hashtags: string; closing: string }) {
  const lines: (string | false | null | undefined)[] = [];
  const items = spec.items.filter((i) => i.title);
  switch (spec.template) {
    case "evento":
      lines.push(
        `📅 ${spec.title}`,
        spec.date && `🗓️ ${spec.date}${spec.time ? ` às ${spec.time}` : ""}`,
        spec.location && `📍 ${spec.location}`,
        spec.highlight && `\n✅ ${spec.highlight}`,
        opts.eventId && `\n👉 Detalhes${spec.highlight ? " e inscrição" : ""}: ${SITE}/eventos/${opts.eventId}`,
        `\n${opts.closing}`,
      );
      break;
    case "versiculo":
      lines.push(`“${spec.text}”`, spec.reference && `— ${spec.reference}`, `\nQue esta palavra fale ao seu coração hoje. 🙏`);
      break;
    case "aviso":
      lines.push(`📢 ${spec.title}`, spec.text && `\n${spec.text}`);
      break;
    case "capa":
      lines.push(spec.title, spec.text);
      break;
    case "programacao":
      lines.push(
        `🗓️ ${spec.tag ? `${spec.tag.charAt(0)}${spec.tag.slice(1).toLowerCase()} — ` : ""}${spec.title}`,
        "",
        ...items.map((i) => `• ${[i.label, i.title].filter(Boolean).join(" — ")}${i.detail ? ` às ${i.detail}` : ""}`),
        `\n${opts.closing}`,
        `👉 Programação completa: ${SITE}/eventos`,
      );
      break;
    case "aniversariantes":
      lines.push(`🎉 Aniversariantes de ${spec.title}!`, "", ...items.map((i) => `🎂 ${[i.label, i.title].filter(Boolean).join(" — ")}`), spec.text && `\n${spec.text}`);
      break;
  }
  const body = lines.filter((l): l is string => typeof l === "string").join("\n");
  return `${body.replace(/\n{3,}/g, "\n\n").trim()}${opts.hashtags ? `\n\n${opts.hashtags}` : ""}`;
}
