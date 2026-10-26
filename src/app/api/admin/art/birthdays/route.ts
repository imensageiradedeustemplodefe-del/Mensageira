import { prisma } from "@/lib/prisma";
import { error, handler, json, requireAdmin } from "@/lib/api";

// Aniversariantes do mês (membros ativos) para a arte: só o dia e o nome (nome e último sobrenome).
// Fica em /api/admin/art para a mídia poder usar sem acesso ao cadastro completo de membros.
export const GET = handler(async (req) => {
  await requireAdmin();
  const month = Number(new URL(req.url).searchParams.get("month"));
  if (!Number.isInteger(month) || month < 1 || month > 12) return error("Mês inválido");
  const members = await prisma.member.findMany({ where: { status: "ativo", birthDate: { not: null } }, select: { name: true, birthDate: true } });
  const rows = members
    .filter((m) => m.birthDate!.getUTCMonth() + 1 === month)
    .map((m) => {
      const parts = m.name.trim().split(/\s+/);
      return { day: m.birthDate!.getUTCDate(), name: parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0] };
    })
    .sort((a, b) => a.day - b.day || a.name.localeCompare(b.name));
  return json(rows);
});
