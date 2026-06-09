import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/login"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // The refresh token is an HttpOnly cookie set by the API on login/refresh.
  // It's the only persistent session signal available to the middleware
  // (the access token lives in memory only and is never sent as a cookie).
  const hasSession = !!request.cookies.get("refreshToken")?.value;

  if (!isPublicRoute && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
