import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The Quantia seal — cobalt tile, two osso quarter-circles, moss centre.
 *
 * Hard-coded hexes rather than tokens on purpose: a logo keeps its colours in
 * both themes. It reads on the warm osso background and on graphite alike.
 */
export function BrandGlyph({ size = 38, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 drop-shadow-[0_6px_14px_rgba(31,60,224,0.28)]", className)}
    >
      <rect width="36" height="36" rx="9" fill="#1F3CE0" />
      <path d="M0 9C0 4 4 0 9 0H18A18 18 0 0 1 0 18Z" fill="#EFEBE1" />
      <path d="M36 27c0 5-4 9-9 9H18A18 18 0 0 1 36 18Z" fill="#EFEBE1" />
      <circle cx="18" cy="18" r="3.4" fill="#2C6B57" />
    </svg>
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
        className="font-display font-extrabold tracking-[-0.02em] text-[var(--text)]"
        style={{ fontSize: textSize }}
      >
        Quan<span className="text-[var(--brand-accent)]">tia</span>
      </span>
    </Link>
  );
}
