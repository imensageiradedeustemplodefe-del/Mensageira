import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { canUseApi, isStaffRole } from "@/lib/roles";

// Protege /admin (menos /admin/login) e /api/admin/*: só a equipe entra, e cada papel só nas suas rotas.
// A conferência completa (com o papel atualizado do banco) se repete nos handlers.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
  const role = isStaffRole(token?.role) ? token.role : null;

  if (pathname.startsWith("/api/admin")) {
    if (!role) return NextResponse.json({ error: "Faça login no painel" }, { status: 401 });
    if (!canUseApi(role, pathname)) return NextResponse.json({ error: "Seu usuário não tem acesso a esta área" }, { status: 403 });
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    if (role) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && !role) {
    const url = new URL("/admin/login", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
