import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, parseBody } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(5).max(3000),
});

// Mensagens do formulário de Contato (ficam no painel administrativo)
export const POST = handler(async (req) => {
  const data = await parseBody(req, schema);
  await prisma.contactMessage.create({
    data: { name: data.name, email: data.email, phone: data.phone?.trim() || null, subject: data.subject, message: data.message },
  });
  return json({ success: true }, { status: 201 });
});
