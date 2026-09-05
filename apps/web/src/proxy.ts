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

  // `?expired=1` is the client reporting that it has just torn its session down.
  // The cookie can survive that — the logout request may never have landed, or the
  // API may be down — and bouncing back to /dashboard on a session the API rejects
  // is a trap: every request 401s and the user cannot reach the login screen to
  // start over. The flag lets /login win over a cookie that is no longer usable.
  const isReturningFromLogout = request.nextUrl.searchParams.get("expired") === "1";

  if (pathname === "/login" && hasSession && !isReturningFromLogout) {
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
