import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getStaffSession } from "@/lib/auth";
import { canUseApi } from "@/lib/roles";
import { HttpError } from "@/lib/http-error";
import { refreshPublicData } from "@/lib/public-cache";

export { HttpError };

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Exige alguém da equipe logado (401 se não). Qual área cada papel alcança (admin, mídia, secretaria)
 * é conferido antes, em handler(), pelo caminho da rota (src/lib/roles.ts).
 */
export async function requireAdmin() {
  const session = await getStaffSession();
  if (!session) throw new HttpError(401, "Faça login no painel");
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

const MUTATIONS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Wraps a route handler, converting thrown HttpError/ZodError into JSON responses. */
export function handler<Ctx>(fn: (request: Request, ctx: Ctx) => Promise<Response>) {
  return async (request: Request, ctx: Ctx) => {
    try {
      const { pathname } = new URL(request.url);
      if (pathname.startsWith("/api/admin/")) {
        const session = await getStaffSession();
        if (!session) return error("Faça login no painel", 401);
        if (!canUseApi(session.user.role, pathname)) return error("Seu usuário não tem acesso a esta área", 403);
      }
      const response = await fn(request, ctx);
      // Alteração feita no painel: o site público passa a mostrar os dados novos na hora
      if (response.ok && MUTATIONS.has(request.method) && new URL(request.url).pathname.startsWith("/api/admin/")) {
        refreshPublicData();
      }
      return response;
    } catch (err) {
      if (err instanceof HttpError) return error(err.message, err.status);
      if (err instanceof ZodError) return error(err.issues[0]?.message ?? "Dados inválidos", 400);
      console.error(err);
      // Nunca devolve detalhes internos (consultas, tabelas, stack) para quem chamou
      return error("Erro interno. Tente novamente em instantes.", 500);
    }
  };
}

/** Reads a route param from the (async) context. */
export async function param(ctx: { params: Promise<Record<string, string>> }, name: string) {
  const params = await ctx.params;
  return params[name];
}
