import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPushToAll } from "@/lib/push";
import { collectionRoutes, itemRoutes } from "@/lib/admin-crud";

// Zod schemas use the snake_case keys the admin UI sends; they are converted to camelCase before Prisma.

const optionalStr = z.string().trim().max(2000).nullable().optional();
const optionalUrl = z.string().trim().max(2000).nullable().optional();
const optionalDate = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .optional()
  .transform((v) => (v ? new Date(v) : v));

// ---------- Testimonies ----------
const testimonyUpdate = z.object({ is_approved: z.boolean().optional() });
export const testimonies = {
  delegate: prisma.testimony,
  createSchema: z.object({ name: z.string().min(2), content: z.string().min(10) }),
  updateSchema: testimonyUpdate,
  list: { orderBy: { createdAt: "desc" } },
  afterUpdate: async (record: { isApproved: boolean; name: string }, previous: { isApproved: boolean }) => {
    if (record.isApproved && !previous.isApproved) {
      await sendPushToAll({ title: "✨ Novo Testemunho", body: `Novo testemunho de ${record.name}`, url: "/testemunhos" });
    }
  },
};

// ---------- Prayer requests ----------
export const prayers = {
  delegate: prisma.prayerRequest,
  createSchema: z.object({}),
  updateSchema: z.object({
    is_approved: z.boolean().optional(),
    is_completed: z.boolean().optional(),
    approved_at: optionalDate,
    completed_at: optionalDate,
  }),
  list: { orderBy: { createdAt: "desc" } },
};

// ---------- Contact messages ----------
export const contactMessages = {
  delegate: prisma.contactMessage,
  createSchema: z.object({}),
  updateSchema: z.object({
    is_read: z.boolean().optional(),
    read_at: optionalDate,
  }),
  list: { orderBy: { createdAt: "desc" } },
};

// ---------- Events ----------
const eventBase = z.object({
  title: z.string().trim().min(2).max(200),
  description: optionalStr,
  event_date: z.string().datetime({ offset: true }).transform((v) => new Date(v)),
  end_date: optionalDate,
  location: optionalStr,
  category: z.string().trim().min(1).max(50).default("geral"),
  image_url: optionalUrl,
  is_published: z.boolean().default(false),
  max_participants: z.number().int().positive().nullable().optional(),
  registration_required: z.boolean().default(false),
});
export const events = {
  delegate: prisma.event,
  createSchema: eventBase,
  updateSchema: eventBase.partial(),
  list: { orderBy: { eventDate: "desc" }, include: { contacts: true, _count: { select: { registrations: true } } } },
};

// ---------- Event templates ----------
const templateBase = z.object({
  name: z.string().trim().min(2).max(200),
  title: z.string().trim().min(2).max(200),
  category: z.string().trim().min(1).max(50),
  description: optionalStr,
  location: optionalStr,
  is_default: z.boolean().default(false),
});
export const templates = {
  delegate: prisma.eventTemplate,
  createSchema: templateBase,
  updateSchema: templateBase.partial(),
  list: { orderBy: [{ isDefault: "desc" }, { name: "asc" }] },
};

// ---------- Live streams ----------
const liveBase = z.object({
  title: z.string().trim().min(2).max(200),
  description: optionalStr,
  platform: z.string().trim().min(1).max(50).default("youtube"),
  stream_url: z.string().trim().min(1).max(2000),
  embed_url: optionalUrl,
  thumbnail_url: optionalUrl,
  is_live: z.boolean().default(false),
  is_active: z.boolean().default(true),
  chat_enabled: z.boolean().default(true),
  viewer_count: z.number().int().nonnegative().nullable().optional(),
  scheduled_at: optionalDate,
  started_at: optionalDate,
  ended_at: optionalDate,
});
export const live = {
  delegate: prisma.liveStream,
  createSchema: liveBase,
  updateSchema: liveBase.partial(),
  list: { orderBy: { createdAt: "desc" } },
  afterUpdate: async (record: { isLive: boolean; title: string }, previous: { isLive: boolean }) => {
    if (record.isLive && !previous.isLive) {
      await sendPushToAll({ title: "🔴 AO VIVO AGORA!", body: `${record.title} - Assista agora!`, url: "/live" });
    }
  },
};

// ---------- Media ----------
const mediaBase = z.object({
  title: z.string().trim().min(1).max(200),
  description: optionalStr,
  artist: optionalStr,
  media_url: z.string().trim().min(1).max(2000),
  thumbnail_url: optionalUrl,
  duration: z.number().int().nonnegative().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  is_published: z.boolean().default(false),
  is_radio: z.boolean().default(false),
});
export const media = {
  delegate: prisma.mediaItem,
  createSchema: mediaBase,
  updateSchema: mediaBase.partial(),
  list: { orderBy: { createdAt: "desc" }, include: { category: true } },
};

// ---------- Custom notifications ----------
const notificationBase = z.object({
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(1000),
  icon: z.string().trim().max(10).default("📢"),
  url: z.string().trim().max(500).default("/"),
  is_active: z.boolean().default(true),
});
export const customNotifications = {
  delegate: prisma.customNotification,
  createSchema: notificationBase,
  updateSchema: notificationBase.partial(),
  list: { orderBy: { createdAt: "desc" } },
  afterCreate: async (record: { title: string; message: string; icon: string | null; url: string | null; isActive: boolean }) => {
    if (record.isActive) {
      await sendPushToAll({ title: `${record.icon ?? "📢"} ${record.title}`, body: record.message, url: record.url ?? "/" });
    }
  },
};

// ---------- Gallery albums ----------
const albumBase = z.object({
  name: z.string().trim().min(1).max(200),
  description: optionalStr,
  cover_photo_url: optionalUrl,
  event_date: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v ? new Date(v) : v)),
  drive_folder_id: optionalStr,
  is_published: z.boolean().default(false),
});
export const albums = {
  delegate: prisma.galleryAlbum,
  createSchema: albumBase,
  updateSchema: albumBase.partial(),
  list: { orderBy: { createdAt: "desc" }, include: { _count: { select: { photos: true } } } },
};

export { collectionRoutes, itemRoutes };
