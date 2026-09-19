import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, error, parseBody, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";

type Ctx = { params: Promise<{ id: string; fieldId: string }> };

const updateSchema = z.object({
  field_name: z.string().trim().min(1).max(100).optional(),
  field_type: z.string().trim().min(1).max(30).optional(),
  field_label: z.string().trim().min(1).max(200).optional(),
  field_placeholder: z.string().trim().max(200).nullable().optional(),
  is_required: z.boolean().optional(),
  field_options: z.array(z.string()).nullable().optional(),
  field_order: z.number().int().nonnegative().optional(),
});

export const PATCH = handler(async (req, ctx: Ctx) => {
  await requireAdmin();
  const { id: eventId, fieldId } = await ctx.params;
  const f = await parseBody(req, updateSchema);
  const existing = await prisma.eventRegistrationField.findFirst({ where: { id: fieldId, eventId } });
  if (!existing) return error("Campo não encontrado", 404);

  const updated = await prisma.eventRegistrationField.update({
    where: { id: fieldId },
    data: {
      fieldName: f.field_name,
      fieldType: f.field_type,
      fieldLabel: f.field_label,
      fieldPlaceholder: f.field_placeholder,
      isRequired: f.is_required,
      fieldOptions: f.field_options === undefined ? undefined : (f.field_options ?? []),
      fieldOrder: f.field_order,
    },
  });
  return json(snake(updated));
});

export const DELETE = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const { id: eventId, fieldId } = await ctx.params;
  await prisma.eventRegistrationField.deleteMany({ where: { id: fieldId, eventId } });
  return json({ success: true });
});
