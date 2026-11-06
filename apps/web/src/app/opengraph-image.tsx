import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteName, siteTagline } from "@/lib/config/site";

export const alt = `${siteName}: ${siteTagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Generated rather than a checked-in PNG so the card can never drift from the
 * brand tokens. Satori has no access to next/font, so this leans on weight and
 * spacing instead of the display face — the helm carries the identity. Satori
 * cannot fetch a relative URL, so the mark goes in as a data URI.
 *
 * Every element declares `display: flex`: Satori has no block layout and throws
 * on a div with more than one child otherwise.
 */
export default async function OpengraphImage() {
  const mark = await readFile(join(process.cwd(), "public/brand/helmo-mark.png"));
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

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
        {/* White tile: the indigo helm loses contrast straight on the dark gradient. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 76,
            height: 76,
            borderRadius: 18,
            background: "#FFFFFF",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only */}
          <img src={markSrc} width={50} height={58} alt="" />
        </div>
        <div style={{ display: "flex", fontSize: 50, fontWeight: 500, letterSpacing: -1 }}>
          helmo
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
