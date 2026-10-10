import { prisma } from "@/lib/prisma";
import { handler, json, requireAdmin } from "@/lib/api";

// Visão geral das inscrições: todos os eventos com inscrição (ou que já receberam inscritos).
export const GET = handler(async () => {
  await requireAdmin();
  const events = await prisma.event.findMany({
    where: { OR: [{ registrationRequired: true }, { registrations: { some: {} } }] },
    orderBy: { eventDate: "asc" },
    select: {
      id: true,
      title: true,
      eventDate: true,
      location: true,
      maxParticipants: true,
      contributionCents: true,
      registrationRequired: true,
      isPublished: true,
      _count: { select: { registrations: true, registrationFields: true } },
      registrations: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });
  // PIX avisados pela pessoa e ainda não conferidos, por evento
  const reported = await prisma.eventRegistration.groupBy({
    by: ["eventId"],
    where: { paymentReportedAt: { not: null }, contributionPaid: false },
    _count: { _all: true },
  });
  const reportedBy = new Map(reported.map((r) => [r.eventId, r._count._all]));
  return json(
    events.map((e) => ({
      id: e.id,
      title: e.title,
      event_date: e.eventDate,
      location: e.location,
      max_participants: e.maxParticipants,
      contribution_cents: e.contributionCents,
      registration_required: e.registrationRequired,
      is_published: e.isPublished,
      registrations: e._count.registrations,
      fields: e._count.registrationFields,
      last_registration_at: e.registrations[0]?.createdAt ?? null,
      payments_to_check: reportedBy.get(e.id) ?? 0,
    }))
  );
});
