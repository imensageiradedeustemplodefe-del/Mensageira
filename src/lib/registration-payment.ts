import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushTo } from "@/lib/push";

/**
 * Marca a contribuição de uma inscrição como paga ou pendente (painel e link das organizadoras).
 * Ao confirmar, avisa o celular da pessoa se ela pediu para ser avisada.
 * Retorna null se a inscrição não for deste evento.
 */
export async function setContributionPaid(eventId: string, registrationId: string, paid: boolean) {
  const before = await prisma.eventRegistration.findFirst({
    where: { id: registrationId, eventId },
    select: { contributionPaid: true, pushEndpoint: true, event: { select: { title: true } } },
  });
  if (!before) return null;
  await prisma.eventRegistration.update({ where: { id: registrationId }, data: { contributionPaid: paid } });

  // Confirmou agora: avisa o celular da pessoa (se ela pediu para ser avisada)
  let notified = false;
  if (paid && !before.contributionPaid && before.pushEndpoint) {
    const sub = await prisma.pushSubscription.findFirst({ where: { endpoint: before.pushEndpoint, isActive: true } });
    if (sub) {
      notified = true;
      after(() =>
        sendPushTo(sub, {
          title: "Pagamento confirmado ✓",
          body: `Sua contribuição para o ${before.event.title} foi confirmada. Obrigado e até lá! 🙏`,
          url: `/eventos/${eventId}/inscricao`,
          tag: `pagamento-${registrationId}`,
        })
      );
    }
  }
  return { notified };
}
