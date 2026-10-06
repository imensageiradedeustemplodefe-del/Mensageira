import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // O banco (Prisma Postgres) aceita poucas conexões simultâneas. Cada instância serverless abria
  // um pool de até 10 e, com várias instâncias ao mesmo tempo, estourava o limite ("Too many
  // database connections"), derrubando login, notificações e páginas. Agora: poucas conexões por
  // instância, liberadas logo quando ficam ociosas, e fechadas quando a Vercel suspende a função.
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
