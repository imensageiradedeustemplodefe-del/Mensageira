import { prisma } from "@/lib/prisma";
import { handler, json } from "@/lib/api";
import { snake } from "@/lib/case";

export const GET = handler(async () => {
  const streams = await prisma.liveStream.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return json(snake(streams));
});
