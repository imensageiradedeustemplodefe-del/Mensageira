import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http-error";

/** IP de quem fez a requisição (na Vercel o x-forwarded-for é preenchido pela própria plataforma). */
export function clientIp(req: Request | { headers: Headers }) {
  const h = req.headers;
  return (h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0] || "local").trim().slice(0, 64);
}

/**
 * Conta mais uma requisição de `key` na janela e diz se ainda está dentro do limite.
 * Atômico no banco, então funciona com várias instâncias do servidor ao mesmo tempo.
 */
export async function hit(key: string, limit: number, windowSeconds: number) {
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "rate_limits" ("key", "count", "reset_at")
      VALUES (${key}, 1, NOW() + make_interval(secs => ${windowSeconds}))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "rate_limits"."reset_at" < NOW() THEN 1 ELSE "rate_limits"."count" + 1 END,
        "reset_at" = CASE WHEN "rate_limits"."reset_at" < NOW() THEN NOW() + make_interval(secs => ${windowSeconds}) ELSE "rate_limits"."reset_at" END
      RETURNING "count"`;
    return Number(rows[0]?.count ?? 0) <= limit;
  } catch (err) {
    // Se o contador falhar, não derruba o site (só registra)
    console.error("rate limit:", err);
    return true;
  }
}

/** Lança 429 quando o IP passou do limite para esta ação. */
export async function limitOrThrow(req: Request, action: string, limit: number, windowSeconds: number) {
  if (!(await hit(`${action}:${clientIp(req)}`, limit, windowSeconds))) {
    throw new HttpError(429, "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
  }
}

/** Limpeza dos contadores vencidos (chamada pelo cron diário). */
export async function cleanupRateLimits() {
  await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } } }).catch(() => {});
}
