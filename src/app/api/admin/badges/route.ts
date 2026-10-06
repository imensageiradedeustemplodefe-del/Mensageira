import { prisma } from "@/lib/prisma";
import { handler, json, requireAdmin } from "@/lib/api";

// Contadores do menu do painel (o que está esperando alguém olhar).
export const GET = handler(async () => {
  await requireAdmin();
  const contact = await prisma.contactMessage.count({ where: { isRead: false } });
  const prayers = await prisma.prayerRequest.count({ where: { isApproved: false, isCompleted: false } });
  const testimonies = await prisma.testimony.count({ where: { isApproved: false } });
  const live = await prisma.liveStream.count({ where: { isLive: true } });
  return json({ contact, prayers, testimonies, live: live > 0 });
});
