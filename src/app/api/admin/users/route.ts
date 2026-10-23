import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { error, handler, json, parseBody, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";
import { isStaffRole } from "@/lib/roles";
import { userCreateSchema, userSelect } from "@/lib/staff-users";

// Usuários do painel (só o admin chega aqui: /api/admin/users não está liberado para outros papéis)
export const GET = handler(async () => {
  await requireAdmin();
  const users = await prisma.user.findMany({ select: userSelect, orderBy: { username: "asc" } });
  return json(snake(users.filter((u) => isStaffRole(u.role))));
});

export const POST = handler(async (req) => {
  await requireAdmin();
  const body = await parseBody(req, userCreateSchema);
  if (await prisma.user.findUnique({ where: { username: body.username } })) return error("Já existe um usuário com esse nome", 409);
  const user = await prisma.user.create({
    data: { username: body.username, name: body.name, role: body.role, passwordHash: await bcrypt.hash(body.password, 12) },
    select: userSelect,
  });
  return json(snake(user), { status: 201 });
});
