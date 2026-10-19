import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, error, parseBody } from "@/lib/api";
import { isOrganizerToken } from "@/lib/organizer-link";
import { setContributionPaid } from "@/lib/registration-payment";

type Ctx = { params: Promise<{ token: string; registrationId: string }> };

const schema = z.object({ paid: z.boolean() });

// Link das organizadoras: marcar quem pagou (ou desfazer). Vale só para as inscrições do evento do link.
export const PATCH = handler(async (req, ctx: Ctx) => {
  const { token, registrationId } = await ctx.params;
  if (!isOrganizerToken(token)) return error("Link inválido", 404);
  const { paid } = await parseBody(req, schema);

  const event = await prisma.event.findUnique({ where: { organizerToken: token }, select: { id: true, contributionCents: true } });
  if (!event) return error("Este link foi desativado. Peça um novo para a igreja.", 404);
  if (!event.contributionCents) return error("Este evento não tem contribuição", 400);

  const result = await setContributionPaid(event.id, registrationId, paid);
  if (!result) return error("Inscrição não encontrada", 404);
  return json({ success: true, notified: result.notified });
});
