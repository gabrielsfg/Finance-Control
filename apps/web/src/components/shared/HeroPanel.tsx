import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Subtle azulejo-seal echo in the hero corner (opacity .10). */
function TileEcho() {
  return (
    <div className="pointer-events-none absolute -right-[46px] -top-[46px] h-[230px] w-[230px] opacity-[0.1]">
      <svg viewBox="0 0 36 36" fill="none" className="h-full w-full" aria-hidden="true">
        <rect width="36" height="36" rx="9" fill="#fff" />
        <path d="M0 9C0 4 4 0 9 0H18A18 18 0 0 1 0 18Z" fill="#17211D" />
        <path d="M36 27c0 5-4 9-9 9H18A18 18 0 0 1 36 18Z" fill="#17211D" />
      </svg>
    </div>
  );
}

/**
 * The single dark hero panel — the dramatic point of a page (patrimônio,
 * período, etc.). Dark in both themes via `--panel*` tokens. Gets a border
 * in dark mode to separate from the background.
 */
export function HeroPanel({
  children,
  className,
  split,
}: {
  children: ReactNode;
  className?: string;
  /** When true, lays children out as the editorial 1.05fr / 1.25fr two-column hero. */
  split?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[26px] border border-transparent p-[30px] dark:border-[var(--border-color)]",
        split && "grid grid-cols-1 gap-[34px] lg:grid-cols-[1.05fr_1.25fr]",
        className,
      )}
      style={{
        background: "radial-gradient(120% 140% at 8% 0%, var(--panel-2), var(--panel) 60%)",
        color: "var(--panel-foreground)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <TileEcho />
      {children}
    </section>
  );
}
