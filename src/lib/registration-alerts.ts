import { prisma } from "@/lib/prisma";
import { sendPushToAdmins } from "@/lib/push";
import { formatBRL, registrationCode } from "@/lib/pix";

const NAME_SKIP = new Set(["rating", "checkbox", "select", "date", "number", "phone", "tel", "email"]);

/** Avisa os celulares da equipe: nova inscrição ou PIX informado pela pessoa. */
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
    const url = `/admin?tab=registrations&event=${reg.event.id}`;

    if (kind === "new") {
      await sendPushToAdmins({
        title: `Nova inscrição 📝 ${reg.event.title}`,
        body: `${name} se inscreveu (${count}${reg.event.maxParticipants ? ` de ${reg.event.maxParticipants}` : ""} inscritos).`,
        url,
        tag: `admin-insc-${reg.event.id}`,
      });
    } else {
      await sendPushToAdmins({
        title: `PIX informado 💸 ${reg.event.title}`,
        body: `${name} (código ${registrationCode(registrationId)}) avisou que pagou${
          reg.event.contributionCents ? ` ${formatBRL(reg.event.contributionCents)}` : ""
        }. Confira no extrato e confirme.`,
        url,
        tag: `admin-pix-${registrationId}`,
      });
    }
  } catch (err) {
    console.error("aviso da equipe:", err);
  }
}
