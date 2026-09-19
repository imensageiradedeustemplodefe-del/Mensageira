import { prisma } from "@/lib/prisma";
import { handler, json, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";

// Lightweight datasets used by the admin dashboard (stats, charts and recent activity).
export const GET = handler(async () => {
  await requireAdmin();
  const [testimonies, prayers, events, streams, photos, albums] = await Promise.all([
    prisma.testimony.findMany({ select: { id: true, name: true, isApproved: true, createdAt: true } }),
    prisma.prayerRequest.findMany({ select: { id: true, name: true, isApproved: true, createdAt: true } }),
    prisma.event.findMany({ select: { id: true, title: true, eventDate: true, isPublished: true, createdAt: true } }),
    prisma.liveStream.findMany({ select: { id: true, title: true, isLive: true, isActive: true, createdAt: true } }),
    prisma.galleryPhoto.findMany({ select: { id: true, isPublished: true, createdAt: true } }),
    prisma.galleryAlbum.findMany({ select: { id: true, isPublished: true, createdAt: true } }),
  ]);
  return json(snake({ testimonies, prayers, events, streams, photos, albums }));
});
