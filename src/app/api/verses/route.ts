import { prisma } from "@/lib/prisma";
import { handler, json } from "@/lib/api";
import { snake } from "@/lib/case";

export const GET = handler(async () => {
  const verses = await prisma.dailyVerse.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  return json(snake(verses));
});
