import { prisma } from "@/lib/prisma";
import { handler, json } from "@/lib/api";
import { snake } from "@/lib/case";
import { publicCache } from "@/lib/public-cache";

const getEvents = publicCache("events", 300, async () => {
  const events = await prisma.event.findMany({
    where: { isPublished: true },
    orderBy: { eventDate: "asc" },
    include: { contacts: { select: { contactInfo: true } } },
  });
  return snake(
    events.map(({ contacts, ...e }) => ({
      ...e,
      contactInfo: contacts[0]?.contactInfo ?? null,
    }))
  );
});

export const GET = handler(async () => json(await getEvents()));
