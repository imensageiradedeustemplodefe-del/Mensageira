import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { error, handler, json, param, parseBody, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";
import { userSelect, userUpdateSchema } from "@/lib/staff-users";

type Ctx = { params: Promise<{ id: string }> };

/** O painel nunca pode ficar sem administrador. */
async function isLastAdmin(id: string) {
  const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
  return admins.length === 1 && admins[0].id === id;
}

export const PATCH = handler(async (req, ctx: Ctx) => {
  const session = await requireAdmin();
  const id = await param(ctx, "id");
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return error("Usuário não encontrado", 404);
  const body = await parseBody(req, userUpdateSchema);
  if (body.role && body.role !== "admin" && existing.role === "admin") {
    if (id === session.user.id) return error("Você não pode tirar o seu próprio acesso de administrador", 400);
    if (await isLastAdmin(id)) return error("Precisa ficar pelo menos um administrador", 400);
  }
  if (body.username && body.username !== existing.username && (await prisma.user.findUnique({ where: { username: body.username } }))) {
    return error("Já existe um usuário com esse nome", 409);
  }
  const user = await prisma.user.update({
    where: { id },
    data: {
      username: body.username,
      name: body.name,
      role: body.role,
      ...(body.password ? { passwordHash: await bcrypt.hash(body.password, 12) } : {}),
    },
    select: userSelect,
  });
  return json(snake(user));
});

export const DELETE = handler(async (_req, ctx: Ctx) => {
  const session = await requireAdmin();
  const id = await param(ctx, "id");
  if (id === session.user.id) return error("Você não pode excluir o seu próprio usuário", 400);
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return error("Usuário não encontrado", 404);
  if (existing.role === "admin" && (await isLastAdmin(id))) return error("Precisa ficar pelo menos um administrador", 400);
  await prisma.user.delete({ where: { id } });
  return json({ success: true });
});
