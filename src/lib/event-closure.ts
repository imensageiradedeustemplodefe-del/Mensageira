// Encerramento de inscrições e contribuições de um evento: pela chave no painel (na hora) ou programado
// (data e hora). Conferido a cada acesso, então o programado vale sozinho, sem tarefa agendada.

type When = Date | string | null | undefined;

/** Encerrado pela chave ou porque já passou do horário programado. */
export function isClosed(flag: boolean | null | undefined, closeAt: When, now = Date.now()) {
  return !!flag || (!!closeAt && new Date(closeAt).getTime() <= now);
}

/** Horário programado ainda no futuro (para mostrar "encerra sozinho em ..."). */
export function scheduledClose(closeAt: When, now = Date.now()) {
  return closeAt && new Date(closeAt).getTime() > now ? new Date(closeAt) : null;
}

/** "25/10 às 18:00" no horário de Brasília */
export function fmtClose(d: Date) {
  const tz = { timeZone: "America/Sao_Paulo" } as const;
  return `${d.toLocaleDateString("pt-BR", { ...tz, day: "2-digit", month: "2-digit" })} às ${d.toLocaleTimeString("pt-BR", { ...tz, hour: "2-digit", minute: "2-digit" })}`;
}
