import type { MetadataRoute } from "next";
import { privatePaths, siteUrl } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The authenticated area redirects to /login anyway; keeping crawlers out
      // stops those redirects from showing up as indexed dead ends. No trailing
      // slash — a bare prefix covers the segment and everything under it.
      disallow: [...privatePaths],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
