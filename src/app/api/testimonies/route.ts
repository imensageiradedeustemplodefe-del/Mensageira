import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, parseBody } from "@/lib/api";
import { snake } from "@/lib/case";

export const GET = handler(async () => {
  const testimonies = await prisma.testimony.findMany({
    where: { isApproved: true },
    orderBy: { createdAt: "desc" },
  });
  return json(snake(testimonies));
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  content: z.string().trim().min(10).max(5000),
});

export const POST = handler(async (req) => {
  const data = await parseBody(req, schema);
  const testimony = await prisma.testimony.create({ data });
  return json(snake(testimony), { status: 201 });
});
