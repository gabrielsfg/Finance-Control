import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Width over height of the helm artwork in /brand/helmo-mark.png. */
const MARK_ASPECT = 0.867;

/**
 * The Helmo helm — the ship's wheel with the pie quarter. A raster placeholder
 * cut from the logo artwork until there is a vector version; `size` is its height.
 */
export function BrandGlyph({ size = 38, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/helmo-mark.png"
      alt=""
      aria-hidden="true"
      width={Math.round(size * MARK_ASPECT)}
      height={size}
      priority
      className={cn("shrink-0", className)}
    />
  );
}

/**
 * Glyph + wordmark, linking home. The sidebar keeps its own copy of the
 * wordmark because it has to squeeze shut with the rail — this is for
 * everywhere the mark just sits there.
 */
export function BrandMark({
  glyphSize = 32,
  textSize = 20,
  className,
}: {
  glyphSize?: number;
  textSize?: number;
  className?: string;
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-[11px]", className)}>
      <BrandGlyph size={glyphSize} />
      <span
        className="font-display font-medium tracking-[-0.01em] text-[var(--text)]"
        style={{ fontSize: textSize }}
      >
        helmo
      </span>
    </Link>
  );
}
