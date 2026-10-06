"use client";

// Pergunta de escala de 0 a 5 com ícones (ex.: "Quão ansiosa você está?").
// O estilo dos ícones fica salvo em field_options[0] do campo do formulário.

export const RATING_STYLES = {
  estrelas: { label: "Estrelas", icons: ["⭐", "⭐", "⭐", "⭐", "⭐"] },
  coracoes: { label: "Corações", icons: ["❤️", "❤️", "❤️", "❤️", "❤️"] },
  carinhas: { label: "Carinhas", icons: ["😐", "🙂", "😊", "😄", "🤩"] },
  fogo: { label: "Fogo", icons: ["🔥", "🔥", "🔥", "🔥", "🔥"] },
  maos: { label: "Mãos para o alto", icons: ["🙌", "🙌", "🙌", "🙌", "🙌"] },
} as const;

export type RatingStyle = keyof typeof RATING_STYLES;

export const ratingStyleOf = (options?: string[] | null): RatingStyle => {
  const s = options?.[0];
  return s && s in RATING_STYLES ? (s as RatingStyle) : "estrelas";
};

const LEVELS = ["Nada", "Um pouquinho", "Pouco", "Mais ou menos", "Bastante", "Muito!"];

export function RatingInput({
  value,
  onChange,
  style = "estrelas",
  id,
}: {
  value?: string;
  onChange: (v: string) => void;
  style?: RatingStyle;
  id?: string;
}) {
  const n = value === undefined || value === "" ? null : Number(value);
  const icons = RATING_STYLES[style].icons;

  return (
    <div id={id} role="radiogroup" className="space-y-2">
      <div className="flex items-center justify-between gap-1 max-w-sm">
        <button
          type="button"
          role="radio"
          aria-checked={n === 0}
          aria-label="0 — Nada"
          onClick={() => onChange("0")}
          className={`h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-full border text-sm font-semibold transition ${
            n === 0 ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:border-primary/50"
          }`}
        >
          0
        </button>
        {icons.map((icon, i) => {
          const level = i + 1;
          const active = n !== null && n >= level;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={n === level}
              aria-label={`${level} — ${LEVELS[level]}`}
              onClick={() => onChange(String(level))}
              className={`h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-full flex items-center justify-center text-[22px] sm:text-2xl transition-all ${
                active ? "scale-110 bg-primary/10" : "opacity-25 hover:opacity-60"
              }`}
            >
              <span aria-hidden>{icon}</span>
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground h-5">{n === null ? "Toque para marcar de 0 a 5" : `${n} de 5 — ${LEVELS[n]}`}</p>
    </div>
  );
}

/** Seletor do estilo de ícones (usado no painel ao criar o campo). */
export function RatingStylePicker({ value, onChange }: { value: RatingStyle; onChange: (s: RatingStyle) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(RATING_STYLES) as RatingStyle[]).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`rounded-lg border px-3 py-2 text-sm transition ${
            value === s ? "border-primary bg-primary/10 font-semibold" : "hover:border-primary/40"
          }`}
        >
          <span className="mr-1.5">{RATING_STYLES[s].icons.slice(0, 3).join("")}</span>
          {RATING_STYLES[s].label}
        </button>
      ))}
    </div>
  );
}
