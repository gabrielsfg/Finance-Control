import type { NextConfig } from "next";

/**
 * Sent on every response. No full Content-Security-Policy yet: the theme script in
 * the root layout is inline and the Pluggy widget pulls its own scripts and frames,
 * so a script-src policy needs nonces and an audit of Pluggy's origins first. The
 * `frame-ancestors` directive alone is safe to ship — it only says who may embed us.
 */
const securityHeaders = [
  // Browsers ignore this over plain http, so it is harmless locally.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Clickjacking: a finance app has no reason to be framed by anyone.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  {
    key: "Permissions-Policy",
    // Camera and payment stay allowed: the Pluggy widget frames bank flows we do not
    // control, and some of them may ask for either.
    value: "microphone=(), geolocation=(), usb=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Never ship source maps to the browser in production.
  // Keeps TypeScript source code out of DevTools.
  productionBrowserSourceMaps: false,
  // Drops `X-Powered-By: Next.js` — no need to advertise the stack.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
