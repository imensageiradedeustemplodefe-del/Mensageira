import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, parseBody } from "@/lib/api";
import { snake } from "@/lib/case";
import { encryptContact, encryptionKeyHash } from "@/lib/crypto";
import { PRAYER_CATEGORIES, sanitizeName } from "@/lib/prayers";

// Public, sanitized list (mirrors the `public_prayer_requests` view)
export const GET = handler(async () => {
  const requests = await prisma.prayerRequest.findMany({
    where: { isApproved: true, allowPublicShare: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, requestText: true, category: true, isUrgent: true, createdAt: true },
  });
  return json(
    snake(
      requests.map(({ name, ...r }) => ({
        ...r,
        displayName: sanitizeName(name),
      }))
    )
  );
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  request_text: z.string().trim().min(10).max(2000),
  category: z.enum(PRAYER_CATEGORIES).default("geral"),
  is_urgent: z.boolean().default(false),
  allow_public_share: z.boolean().default(false),
});

export const POST = handler(async (req) => {
  const data = await parseBody(req, schema);
  const email = data.email?.trim() || null;
  const phone = data.phone?.trim() || null;

  const request = await prisma.prayerRequest.create({
    data: {
      name: data.name,
      requestText: data.request_text,
      category: data.category,
      isUrgent: data.is_urgent,
      allowPublicShare: data.allow_public_share,
      hasContactInfo: !!(email || phone),
      encryptedContact:
        email || phone
          ? {
              create: {
                encryptedEmail: email ? encryptContact(email) : null,
                encryptedPhone: phone ? encryptContact(phone) : null,
                encryptionKeyHash: encryptionKeyHash(),
              },
            }
          : undefined,
    },
  });

  return json(snake({ id: request.id, createdAt: request.createdAt }), { status: 201 });
});
