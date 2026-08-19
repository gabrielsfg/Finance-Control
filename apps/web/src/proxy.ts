import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The legal pages are linked from the registration form and from the profile, so
// they have to open in both states — bouncing a visitor to /login for reading the
// terms would defeat the point of asking them to read the terms.
const publicRoutes = ["/", "/login", "/privacy", "/terms"];

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
  // robots.txt, sitemap.xml and the generated OG card are metadata routes: they
  // are not in `publicRoutes`, so without this exclusion the middleware would
  // bounce every crawler to /login and the site would index as nothing.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|opengraph-image).*)"],
};
