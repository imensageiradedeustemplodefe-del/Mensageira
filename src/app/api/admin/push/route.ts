import { prisma } from "@/lib/prisma";
import { handler, json, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";

// Diagnóstico das notificações push: assinaturas e histórico de envios
export const GET = handler(async () => {
  await requireAdmin();
  const [subs, logs] = await Promise.all([
    prisma.pushSubscription.findMany({ select: { endpoint: true, isActive: true, createdAt: true, updatedAt: true } }),
    prisma.pushLog.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
  ]);
  const byHost: Record<string, number> = {};
  for (const s of subs) {
    if (!s.isActive) continue;
    const host = (() => { try { return new URL(s.endpoint).host; } catch { return "?"; } })();
    const label = host.includes("google") ? "Chrome / Android" : host.includes("mozilla") ? "Firefox" : host.includes("apple") ? "Safari / iPhone" : host.includes("windows") || host.includes("notify") ? "Edge / Windows" : host;
    byHost[label] = (byHost[label] ?? 0) + 1;
  }
  return json({
    total: subs.length,
    active: subs.filter((s) => s.isActive).length,
    inactive: subs.filter((s) => !s.isActive).length,
    by_platform: byHost,
    vapid_configured: !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    cron_secret_configured: !!process.env.CRON_SECRET,
    logs: snake(logs),
  });
});
