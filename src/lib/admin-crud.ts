import type { ZodType } from "zod";
import { handler, json, error, parseBody, param, requireAdmin } from "@/lib/api";
import { snake, camel } from "@/lib/case";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Minimal shape of a Prisma model delegate used by the generic CRUD handlers.
interface Delegate {
  findMany(args?: any): Promise<any[]>;
  findUnique(args: any): Promise<any>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
  delete(args: any): Promise<any>;
}

interface CrudOptions<C, U> {
  delegate: Delegate;
  createSchema: ZodType<C>;
  updateSchema: ZodType<U>;
  /** Default `findMany` args for the list endpoint (orderBy, include...). */
  list?: Record<string, unknown>;
  /** Hooks to react after a write (e.g. send push notifications). */
  afterCreate?: (record: any) => Promise<void> | void;
  afterUpdate?: (record: any, previous: any) => Promise<void> | void;
}

/** Builds admin-only list/create handlers for a collection route (`/api/admin/x`). */
export function collectionRoutes<C, U>(opts: CrudOptions<C, U>) {
  const GET = handler(async () => {
    await requireAdmin();
    const rows = await opts.delegate.findMany(opts.list ?? {});
    return json(snake(rows));
  });

  const POST = handler(async (req) => {
    await requireAdmin();
    const data = await parseBody(req, opts.createSchema);
    const record = await opts.delegate.create({ data: camel(data) });
    await opts.afterCreate?.(record);
    return json(snake(record), { status: 201 });
  });

  return { GET, POST };
}

type Ctx = { params: Promise<{ id: string }> };

/** Builds admin-only get/update/delete handlers for an item route (`/api/admin/x/[id]`). */
export function itemRoutes<C, U>(opts: CrudOptions<C, U>) {
  const GET = handler(async (_req, ctx: Ctx) => {
    await requireAdmin();
    const id = await param(ctx, "id");
    const record = await opts.delegate.findUnique({ where: { id } });
    if (!record) return error("Registro não encontrado", 404);
    return json(snake(record));
  });

  const PATCH = handler(async (req, ctx: Ctx) => {
    await requireAdmin();
    const id = await param(ctx, "id");
    const data = await parseBody(req, opts.updateSchema);
    const previous = await opts.delegate.findUnique({ where: { id } });
    if (!previous) return error("Registro não encontrado", 404);
    const record = await opts.delegate.update({ where: { id }, data: camel(data) });
    await opts.afterUpdate?.(record, previous);
    return json(snake(record));
  });

  const DELETE = handler(async (_req, ctx: Ctx) => {
    await requireAdmin();
    const id = await param(ctx, "id");
    await opts.delegate.delete({ where: { id } });
    return json({ success: true });
  });

  return { GET, PATCH, DELETE };
}
