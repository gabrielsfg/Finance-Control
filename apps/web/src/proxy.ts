import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { privatePaths } from "@/lib/config/site";
import { RETURN_TO_PARAM, sanitizeReturnTo } from "@/lib/utils/returnTo";

// The legal pages are linked from the registration form and from the profile, so
// they have to open in both states — bouncing a visitor to /login for reading the
// terms would defeat the point of asking them to read the terms. The Open Finance
// callback is where a bank sends the browser back after an authorization; it shows no
// data and may open in a tab without the session cookie.
const publicRoutes = ["/", "/login", "/privacy", "/terms", "/open-finance/callback"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.some((route) => pathname === route);
  // Only the known private area bounces to /login. Anything else falls through, so a
  // mistyped or dead URL answers with the 404 page instead of a redirect — crawlers
  // drop a 404 from the index, while a redirect to /login keeps it alive.
  const isPrivateRoute =
    !isPublicRoute &&
    privatePaths.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  // The refresh token is an HttpOnly cookie set by the API on login/refresh.
  // It's the only persistent session signal available to the middleware
  // (the access token lives in memory only and is never sent as a cookie).
  const hasSession = !!request.cookies.get("refreshToken")?.value;

  if (isPrivateRoute && !hasSession) {
    // Remember where the visitor was going. The MCP consent page depends on it: the
    // authorization flow lands on /oauth/consent?request=…, and dropping that on the way
    // through login would strand the AI client mid-connection.
    const loginUrl = new URL("/login", request.url);
    const target = sanitizeReturnTo(pathname + request.nextUrl.search);
    if (target && target !== "/dashboard") loginUrl.searchParams.set(RETURN_TO_PARAM, target);
    return NextResponse.redirect(loginUrl);
  }

  // `?expired=1` is the client reporting that it has just torn its session down.
  // The cookie can survive that — the logout request may never have landed, or the
  // API may be down — and bouncing back to /dashboard on a session the API rejects
  // is a trap: every request 401s and the user cannot reach the login screen to
  // start over. The flag lets /login win over a cookie that is no longer usable.
  const isReturningFromLogout = request.nextUrl.searchParams.get("expired") === "1";

  if (pathname === "/login" && hasSession && !isReturningFromLogout) {
    const target = sanitizeReturnTo(request.nextUrl.searchParams.get(RETURN_TO_PARAM));
    return NextResponse.redirect(new URL(target ?? "/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Metadata routes (robots.txt, sitemap.xml, the manifest, the icons and the generated
  // OG card) and the static files in /public are not in `publicRoutes`: without this
  // exclusion the proxy would bounce every crawler and browser fetch for them to
  // /login and the site would index as nothing. Static files are matched by extension
  // rather than listed one by one, so a file dropped in /public (a search console
  // verification file, an image) works without touching this. `.well-known` holds the
  // app-link files the stores fetch to tie the mobile app to the domain.
  matcher: [
    "/((?!_next/static|_next/image|\\.well-known|icon|apple-icon|opengraph-image|twitter-image|[^?]*\\.(?:ico|png|jpe?g|gif|webp|avif|svg|txt|xml|webmanifest|json|html?|woff2?)$).*)",
  ],
};
