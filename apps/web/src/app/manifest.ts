import type { MetadataRoute } from "next";
import { siteDescription, siteName, siteTagline } from "@/lib/config/site";

/**
 * Makes the site installable ("Adicionar à tela inicial") and gives Android the
 * name, colours and icons for the launcher and the splash it paints on open.
 * `start_url` is the dashboard: whoever installs it is past the landing page,
 * and the proxy sends a visitor without a session to /login from there anyway.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} · ${siteTagline}`,
    short_name: siteName,
    description: siteDescription,
    lang: "pt-BR",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0E0F10",
    theme_color: "#1F3CE0",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
