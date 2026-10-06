import { prisma, dbMode } from "@/lib/prisma";
import { handler, json } from "@/lib/api";

// Health check: reports which integrations are configured (never exposes values).
export const GET = handler(async () => {
  let database = false;
  let dbError: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message.split("\n").pop() ?? "erro" : "erro";
  }

  const has = (k: string) => !!process.env[k]?.trim();
  // Só esquema + host (sem usuário/senha), para diagnosticar qual conexão está configurada
  const urlInfo = (k: string) => {
    const v = process.env[k]?.trim();
    if (!v) return null;
    try {
      const u = new URL(v);
      return `${u.protocol}//${u.hostname}${u.port ? ":" + u.port : ""}`;
    } catch {
      return "formato inválido";
    }
  };

  return json({
    ok: database && has("AUTH_SECRET"),
    database,
    dbMode,
    dbUrls: { DATABASE_URL: urlInfo("DATABASE_URL"), POSTGRES_URL: urlInfo("POSTGRES_URL"), PRISMA_DATABASE_URL: urlInfo("PRISMA_DATABASE_URL") },
    dbError,
    env: {
      DATABASE_URL: has("DATABASE_URL"),
      AUTH_SECRET: has("AUTH_SECRET") || has("NEXTAUTH_SECRET"),
      AUTH_TRUST_HOST: has("AUTH_TRUST_HOST"),
      CONTACT_ENCRYPTION_KEY: has("CONTACT_ENCRYPTION_KEY"),
      VAPID: has("NEXT_PUBLIC_VAPID_PUBLIC_KEY") && has("VAPID_PRIVATE_KEY"),
      CRON_SECRET: has("CRON_SECRET"),
      NEXT_PUBLIC_SITE_URL: has("NEXT_PUBLIC_SITE_URL"),
    },
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
});
