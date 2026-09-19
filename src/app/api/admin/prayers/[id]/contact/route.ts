import { prisma } from "@/lib/prisma";
import { handler, json, param, requireAdmin } from "@/lib/api";
import { decryptContact } from "@/lib/crypto";

type Ctx = { params: Promise<{ id: string }> };

// Decrypts and returns the contact info of a prayer request (admin only).
export const GET = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const id = await param(ctx, "id");
  const contact = await prisma.encryptedContact.findUnique({ where: { prayerRequestId: id } });
  if (!contact) return json({ email: null, phone: null });
  return json({
    email: contact.encryptedEmail ? decryptContact(contact.encryptedEmail) : null,
    phone: contact.encryptedPhone ? decryptContact(contact.encryptedPhone) : null,
  });
});
