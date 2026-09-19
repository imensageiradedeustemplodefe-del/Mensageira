import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Protects /admin (except /admin/login) and /api/admin/* — full role checks happen in the handlers.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
  const isAdmin = token?.role === "admin";

  if (pathname.startsWith("/api/admin")) {
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso de administrador necessário" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    if (isAdmin) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    const url = new URL("/admin/login", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
