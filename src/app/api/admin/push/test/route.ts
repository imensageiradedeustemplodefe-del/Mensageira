import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, error, parseBody, requireAdmin } from "@/lib/api";
import { sendPushTo, sendPushToAll } from "@/lib/push";

const schema = z.object({
  // endpoint do aparelho atual (teste só para ele) — sem endpoint, envia para todos
  endpoint: z.string().url().optional(),
});

// Envia uma notificação de teste
export const POST = handler(async (req) => {
  await requireAdmin();
  const { endpoint } = await parseBody(req, schema);
  const payload = {
    title: "🔔 Teste de notificação",
    body: `Enviada pelo painel em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}. Se você recebeu, está tudo funcionando!`,
    url: "/",
    tag: "test",
  };
  if (endpoint) {
    const sub = await prisma.pushSubscription.findUnique({ where: { endpoint } });
    if (!sub || !sub.isActive) return error("Este aparelho não está inscrito (ative as notificações pelo sino primeiro).", 404);
    const ok = await sendPushTo(sub, payload);
    return json({ success: ok, sent: ok ? 1 : 0, failed: ok ? 0 : 1 });
  }
  const result = await sendPushToAll(payload, "teste");
  return json({ success: true, ...result });
});
