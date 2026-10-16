import { prisma } from "@/lib/prisma";
import { handler, json } from "@/lib/api";
import { snake } from "@/lib/case";
import { publicCache } from "@/lib/public-cache";

const getVerses = publicCache("verses", 3600, async () =>
  snake(await prisma.dailyVerse.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } }))
);

export const GET = handler(async () => json(await getVerses()));
