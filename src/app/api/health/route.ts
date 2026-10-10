import { prisma, dbMode } from "@/lib/prisma";
import { handler, json } from "@/lib/api";
import { getAdminSession } from "@/lib/auth";

// Health check. Público: só { ok }. Admin logado: quais integrações estão configuradas (nunca os valores).
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
  const ok = database && (has("AUTH_SECRET") || has("NEXTAUTH_SECRET"));
  if (!(await getAdminSession())) return json({ ok }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });

  return json({
    ok,
    database,
    dbMode,
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
