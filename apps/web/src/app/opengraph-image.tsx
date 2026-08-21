import { ImageResponse } from "next/og";
import { siteName, siteTagline } from "@/lib/config/site";

export const alt = `${siteName}: ${siteTagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Generated rather than a checked-in PNG so the card can never drift from the
 * brand tokens. Satori has no access to next/font, so this leans on weight and
 * spacing instead of the display face — the seal carries the identity.
 *
 * Every element declares `display: flex`: Satori has no block layout and throws
 * on a div with more than one child otherwise.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "linear-gradient(135deg, #1A302C 0%, #12201E 55%, #0E0F10 100%)",
        color: "#ECE7DA",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg width="72" height="72" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="9" fill="#1F3CE0" />
          <path d="M0 9C0 4 4 0 9 0H18A18 18 0 0 1 0 18Z" fill="#EFEBE1" />
          <path d="M36 27c0 5-4 9-9 9H18A18 18 0 0 1 36 18Z" fill="#EFEBE1" />
          <circle cx="18" cy="18" r="3.4" fill="#2C6B57" />
        </svg>
        <div style={{ display: "flex", fontSize: 46, fontWeight: 700, letterSpacing: -1.5 }}>
          <span>Quan</span>
          <span style={{ color: "#8197FF" }}>tia</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 66,
            fontWeight: 700,
            letterSpacing: -2.5,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Cada real que entra, sai e rende em um lugar só.
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 28, color: "#8FA39A" }}>
          Contas, orçamento, metas e investimentos na mesma tela.
        </div>
      </div>
    </div>,
    size,
  );
}
