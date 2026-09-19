import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getAdminSession } from "@/lib/auth";

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Throws a 401 HttpError when the current user is not an admin. */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new HttpError(401, "Acesso de administrador necessário");
  return session;
}

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "Corpo da requisição inválido");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new HttpError(400, first ? `${first.path.join(".")}: ${first.message}` : "Dados inválidos");
  }
  return parsed.data;
}

/** Wraps a route handler, converting thrown HttpError/ZodError into JSON responses. */
export function handler<Ctx>(fn: (request: Request, ctx: Ctx) => Promise<Response>) {
  return async (request: Request, ctx: Ctx) => {
    try {
      return await fn(request, ctx);
    } catch (err) {
      if (err instanceof HttpError) return error(err.message, err.status);
      if (err instanceof ZodError) return error(err.issues[0]?.message ?? "Dados inválidos", 400);
      console.error(err);
      return error(err instanceof Error ? err.message : "Erro interno", 500);
    }
  };
}

/** Reads a route param from the (async) context. */
export async function param(ctx: { params: Promise<Record<string, string>> }, name: string) {
  const params = await ctx.params;
  return params[name];
}
