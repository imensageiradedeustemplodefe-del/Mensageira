import { prisma } from "@/lib/prisma";
import { handler, json } from "@/lib/api";
import { snake } from "@/lib/case";

export const GET = handler(async () => {
  const events = await prisma.event.findMany({
    where: { isPublished: true },
    orderBy: { eventDate: "asc" },
    include: { contacts: { select: { contactInfo: true } } },
  });
  return json(
    snake(
      events.map(({ contacts, ...e }) => ({
        ...e,
        contactInfo: contacts[0]?.contactInfo ?? null,
      }))
    )
  );
});
