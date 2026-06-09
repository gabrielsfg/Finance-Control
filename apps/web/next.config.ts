import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Never ship source maps to the browser in production.
  // Keeps TypeScript source code out of DevTools.
  productionBrowserSourceMaps: false,
};

export default nextConfig;
