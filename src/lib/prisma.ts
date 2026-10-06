import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * URL usada pelo app em tempo de execução.
 * O Prisma Postgres tem dois hosts: `db.prisma.io` (direto, limite de 10 conexões no plano grátis,
 * para migrações) e `pooled.db.prisma.io` (PgBouncer, para o tráfego do app). Usar o direto em
 * serverless esgotava as conexões ("Too many database connections") e derrubava login e páginas.
 * As migrações continuam no host direto (prisma.config.ts usa DATABASE_URL sem alteração).
 */
function runtimeUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return { url: raw, mode: "direct" as const };
  try {
    const u = new URL(raw);
    if (u.hostname === "db.prisma.io") {
      u.hostname = "pooled.db.prisma.io";
      return { url: u.toString(), mode: "pooled" as const };
    }
  } catch {
    // URL fora do padrão: usa como está
  }
  return { url: raw, mode: "direct" as const };
}

const { url, mode } = runtimeUrl();
export const dbMode = mode;

function createClient() {
  const pool = new Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });
  attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

// Uma única instância por processo (também em produção: evita abrir pools duplicados)
export const prisma = globalForPrisma.prisma ?? createClient();
globalForPrisma.prisma = prisma;
