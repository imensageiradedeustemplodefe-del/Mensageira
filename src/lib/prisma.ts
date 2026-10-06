import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Como o app se conecta ao banco:
 * - "pooled": produção na Vercel, via PRISMA_DATABASE_URL (prisma+postgres://). O pool de conexões
 *   fica do lado do Prisma Postgres, então muitas instâncias serverless ao mesmo tempo não estouram o
 *   limite de conexões do banco (era o "Too many database connections" que derrubava login e páginas).
 * - "direct": desenvolvimento local / fallback, conexão TCP direta com um pool pequeno.
 */
export const dbMode: "pooled" | "direct" = process.env.PRISMA_DATABASE_URL?.startsWith("prisma+postgres://")
  ? "pooled"
  : "direct";

function createClient() {
  if (dbMode === "pooled") {
    return new PrismaClient({ accelerateUrl: process.env.PRISMA_DATABASE_URL! });
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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
