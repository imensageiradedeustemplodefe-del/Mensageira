import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, json, param, parseBody, requireAdmin } from "@/lib/api";
import { snake } from "@/lib/case";

type Ctx = { params: Promise<{ id: string }> };

const fieldSchema = z.object({
  field_name: z.string().trim().min(1).max(100),
  field_type: z.string().trim().min(1).max(30),
  field_label: z.string().trim().min(1).max(200),
  field_placeholder: z.string().trim().max(200).nullable().optional(),
  is_required: z.boolean().default(false),
  field_options: z.array(z.string()).nullable().optional(),
  field_order: z.number().int().nonnegative().optional(),
});

export const GET = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const eventId = await param(ctx, "id");
  const fields = await prisma.eventRegistrationField.findMany({ where: { eventId }, orderBy: { fieldOrder: "asc" } });
  return json(snake(fields));
});

// POST accepts one field or an array of fields (quick setup)
export const POST = handler(async (req, ctx: Ctx) => {
  await requireAdmin();
  const eventId = await param(ctx, "id");
  const body = await parseBody(req, z.union([fieldSchema, z.array(fieldSchema)]));
  const list = Array.isArray(body) ? body : [body];
  const count = await prisma.eventRegistrationField.count({ where: { eventId } });

  const created = await prisma.$transaction(
    list.map((f, i) =>
      prisma.eventRegistrationField.create({
        data: {
          eventId,
          fieldName: f.field_name,
          fieldType: f.field_type,
          fieldLabel: f.field_label,
          fieldPlaceholder: f.field_placeholder ?? null,
          isRequired: f.is_required,
          fieldOptions: f.field_options ?? [],
          fieldOrder: f.field_order ?? count + i,
        },
      })
    )
  );
  return json(snake(created), { status: 201 });
});

// PUT reorders: body = [{ id, field_order }]
export const PUT = handler(async (req, ctx: Ctx) => {
  await requireAdmin();
  const eventId = await param(ctx, "id");
  const body = await parseBody(req, z.array(z.object({ id: z.string().uuid(), field_order: z.number().int() })));
  await prisma.$transaction(
    body.map((f) => prisma.eventRegistrationField.updateMany({ where: { id: f.id, eventId }, data: { fieldOrder: f.field_order } }))
  );
  return json({ success: true });
});
