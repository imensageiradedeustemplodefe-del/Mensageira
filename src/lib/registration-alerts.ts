import { prisma } from "@/lib/prisma";
import { sendPushTo, sendPushToAdmins, type PushPayload } from "@/lib/push";
import { formatBRL, registrationCode } from "@/lib/pix";

const NAME_SKIP = new Set(["rating", "checkbox", "select", "date", "number", "phone", "tel", "email"]);

/** Avisa os celulares da equipe e das organizadoras do evento: nova inscrição ou PIX informado pela pessoa. */
export async function alertAdminsAboutRegistration(registrationId: string, kind: "new" | "pix") {
  try {
    const reg = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      select: {
        registrationData: true,
        event: {
          select: {
            id: true,
            title: true,
            organizerToken: true,
            organizerAlerts: { where: { subscription: { isActive: true } }, select: { subscription: true } },
            contributionCents: true,
            maxParticipants: true,
            _count: { select: { registrations: true } },
            registrationFields: { orderBy: { fieldOrder: "asc" }, select: { fieldName: true, fieldType: true } },
          },
        },
      },
    });
    if (!reg) return;
    const data = (reg.registrationData ?? {}) as Record<string, unknown>;
    const nameField = reg.event.registrationFields.find((f) => !NAME_SKIP.has(f.fieldType) && data[f.fieldName]);
    const name = nameField ? String(data[nameField.fieldName]).trim().slice(0, 60) : "Alguém";
    const count = reg.event._count.registrations;
    const message: Omit<PushPayload, "url" | "tag"> =
      kind === "new"
        ? {
            title: `Nova inscrição 📝 ${reg.event.title}`,
            body: `${name} se inscreveu (${count}${reg.event.maxParticipants ? ` de ${reg.event.maxParticipants}` : ""} inscritos).`,
          }
        : {
            title: `PIX informado 💸 ${reg.event.title}`,
            body: `${name} (código ${registrationCode(registrationId)}) avisou que pagou${
              reg.event.contributionCents ? ` ${formatBRL(reg.event.contributionCents)}` : ""
            }. Confira no extrato e confirme.`,
          };
    const tag = kind === "new" ? `insc-${reg.event.id}` : `pix-${registrationId}`;

    await sendPushToAdmins({ ...message, url: `/admin?tab=registrations&event=${reg.event.id}`, tag: `admin-${tag}` });

    // Organizadoras: abre o link delas (aparelho que já recebe o aviso da equipe não recebe em dobro)
    if (reg.event.organizerToken) {
      const url = `/organizadores/${reg.event.organizerToken}`;
      await Promise.all(
        reg.event.organizerAlerts
          .filter((a) => !a.subscription.notifyAdmin)
          .map((a) => sendPushTo(a.subscription, { ...message, url, tag: `org-${tag}` }))
      );
    }
  } catch (err) {
    console.error("aviso da equipe:", err);
  }
}
