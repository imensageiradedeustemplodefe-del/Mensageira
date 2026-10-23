import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { error, handler, json, parseBody, requireAdmin } from "@/lib/api";
import { passwordSchema } from "@/lib/staff-users";

// Qualquer pessoa da equipe troca a própria senha (precisa informar a atual)
export const POST = handler(async (req) => {
  const session = await requireAdmin();
  const body = await parseBody(req, z.object({ current: z.string().min(1).max(200), password: passwordSchema }));
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !(await bcrypt.compare(body.current, user.passwordHash))) return error("Senha atual incorreta", 400);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(body.password, 12) } });
  return json({ success: true });
});
