import { NextResponse, type NextRequest } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:3030";

interface SessionUser {
  id: number;
  email: string;
  role: "ADMIN" | "CLIENT";
}

/**
 * Valida la sesión contra NestJS reenviando la cookie del navegador.
 * El proxy corre en el runtime de Node.js, por lo que puede alcanzar el backend.
 */
async function getSessionUser(
  request: NextRequest,
): Promise<SessionUser | null> {
  const cookie = request.headers.get("cookie") ?? "";
  if (!cookie) return null;

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as SessionUser;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAdmin = pathname.startsWith("/admin");
  const needsAuth =
    needsAdmin ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/dashboard");

  if (!needsAuth) {
    return NextResponse.next();
  }

  const user = await getSessionUser(request);

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (needsAdmin && user.role !== "ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/checkout",
    "/checkout/:path*",
    "/profile",
    "/profile/:path*",
    "/dashboard",
    "/dashboard/:path*",
  ],
};
