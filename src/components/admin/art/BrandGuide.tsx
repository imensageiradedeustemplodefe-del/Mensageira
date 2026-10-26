"use client";

import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ART_FORMATS, ART_THEMES, type ArtThemeId } from "@/lib/art/spec";

const DO = [
  "Uma mensagem por arte: título curto (até 5 ou 6 palavras) e só o essencial.",
  "Use os modelos salvos: assim todos os posts ficam com a mesma cara.",
  "Fotos com boa luz, nítidas e com gente sorrindo; toque no rosto para centralizar.",
  "Sempre data, horário e local nos eventos (o gerador já põe).",
  "Escureça a imagem de fundo até o texto ficar fácil de ler.",
  "Copie a legenda pronta e revise antes de postar.",
];
const AVOID = [
  "Misturar outras fontes ou cores fora da paleta.",
  "Texto em cima do rosto das pessoas ou em fundo muito claro e cheio de detalhes.",
  "Postar fotos de crianças sem autorização dos pais.",
  "Artes cheias de texto: o que não couber vai na legenda.",
  "Esticar ou mudar as cores do logo.",
  "Prints de baixa qualidade ou imagens baixadas da internet sem permissão.",
];
const WEEK = [
  ["Segunda", "Versículo da semana (feed ou story)"],
  ["Quarta", "Programação da semana + lembrete do culto de oração"],
  ["Sexta", "Convite para o culto de sexta (story no dia)"],
  ["Domingo", "Culto ao vivo (story) e fotos do culto (carrossel na segunda)"],
  ["Começo do mês", "Aniversariantes do mês e programação do mês"],
];

/** Guia rápido da identidade visual para quem faz os posts. */
export function BrandGuide() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cores</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.keys(ART_THEMES) as ArtThemeId[]).map((id) => {
            const t = ART_THEMES[id];
            return (
              <div key={id} className="rounded-lg border overflow-hidden">
                <div className="h-16 flex items-end justify-between p-2" style={{ background: t.bg }}>
                  <span style={{ color: t.text, fontFamily: "serif" }} className="text-lg">
                    Aa
                  </span>
                  <span className="w-5 h-5 rounded-full" style={{ background: t.accent }} />
                </div>
                <div className="p-2 text-xs">
                  <p className="font-semibold">{t.label}</p>
                  <p className="text-muted-foreground font-mono">
                    {t.bg} · {t.accent}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Fontes e logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-2xl" style={{ fontFamily: "Georgia, serif" }}>
              Playfair Display
            </p>
            <p className="text-muted-foreground">Títulos. Em itálico, nos versículos.</p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase">Montserrat</p>
            <p className="text-muted-foreground">Detalhes (data, horário, local, etiquetas), em letras maiúsculas e espaçadas.</p>
          </div>
          <p className="text-muted-foreground">
            Logo: sempre pequeno, no rodapé, dentro do círculo branco, com o nome “Igreja Mensageira de Deus”. Não esticar, girar ou trocar as cores.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Formatos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {Object.values(ART_FORMATS).map((f) => (
            <p key={f.label}>
              <span className="font-medium">{f.label}</span> — {f.width} × {f.height} px
            </p>
          ))}
          <p className="text-muted-foreground">
            No feed, prefira o 4:5: ocupa mais espaço na tela. No story, deixe livres as faixas de cima e de baixo (perfil e campo de resposta): o gerador já faz
            isso.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sugestão de semana</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          {WEEK.map(([d, t]) => (
            <p key={d}>
              <span className="font-medium">{d}:</span> {t}
            </p>
          ))}
          <p className="text-muted-foreground pt-1">Melhores horários: de manhã (7h às 9h) e à noite (19h às 21h). Planeje no Calendário de posts.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-green-700 dark:text-green-400">Faça</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {DO.map((t) => (
            <p key={t} className="flex gap-2">
              <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> {t}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-destructive">Evite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {AVOID.map((t) => (
            <p key={t} className="flex gap-2">
              <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" /> {t}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
