import type { MetadataRoute } from "next";
import { publicPaths, siteUrl } from "@/lib/config/site";

/** Priorities: the landing is the entry point, the rest is supporting material. */
const priorities: Record<string, number> = {
  "/": 1,
  "/login": 0.7,
  "/privacy": 0.3,
  "/terms": 0.3,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicPaths.map((path) => ({
    url: `${siteUrl}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: path === "/" ? "monthly" : "yearly",
    priority: priorities[path] ?? 0.5,
  }));
}
