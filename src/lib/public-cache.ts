import { revalidateTag, unstable_cache } from "next/cache";

// O banco (Prisma Postgres) cobra por consulta e o plano grátis tem cota mensal: sem cache, cada visita
// e cada verificação periódica dos aparelhos consultava o banco de novo e a cota acabou no meio do mês.
// As leituras públicas ficam guardadas por alguns minutos; qualquer alteração no painel limpa tudo,
// então o que a equipe muda aparece na hora.

/** Tag de tudo que o público lê (eventos, galeria, versículos, configurações...). */
const PUBLIC_TAG = "public-data";

/**
 * Guarda o resultado de uma leitura pública por `seconds` segundos (por combinação de argumentos).
 * O resultado passa por JSON para ser igual com e sem cache (datas viram texto ISO, como na resposta da API).
 */
export function publicCache<Args extends unknown[], T>(key: string, seconds: number, fn: (...args: Args) => Promise<T>) {
  return unstable_cache(async (...args: Args): Promise<T> => JSON.parse(JSON.stringify(await fn(...args))), ["public", key], {
    revalidate: seconds,
    tags: [PUBLIC_TAG],
  });
}

/** Depois de uma alteração: o próximo acesso público já busca os dados novos no banco. */
export function refreshPublicData() {
  try {
    revalidateTag(PUBLIC_TAG, { expire: 0 });
  } catch (err) {
    // fora de uma requisição (scripts) não há cache para limpar
    console.warn("[public-cache] não foi possível limpar o cache:", err);
  }
}
