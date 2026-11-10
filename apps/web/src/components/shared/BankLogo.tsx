"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { findBank } from "@/lib/config/banks";

type Props = {
  slug: string | null | undefined;
  /** Box size in px. */
  size?: number;
  /** Shown when the bank is unknown (e.g. the account-type icon). */
  fallback?: ReactNode;
  className?: string;
};

/**
 * A bank's logo from `public/banks/{slug}.png` (the site icons downloaded for now),
 * else `{slug}.svg` — to switch a bank to an SVG, add it and delete its PNG. Without either it shows the
 * bank's initials on its brand color; without a known bank, `fallback`.
 */
export function BankLogo({ slug, size = 40, fallback = null, className }: Props) {
  const bank = findBank(slug);
  // 0: try the PNG, 1: try the SVG, 2: no file.
  const [attempt, setAttempt] = useState(0);
  const missing = attempt >= 2;

  if (!bank) return <>{fallback}</>;

  const box = { width: size, height: size };
  if (missing) {
    const initials = bank.name
      .split(/\s+/)
      .filter((w) => w.length > 2 || /\d/.test(w))
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || bank.name.slice(0, 2).toUpperCase();
    return (
      <div
        aria-label={bank.name}
        className={cn("flex shrink-0 items-center justify-center rounded-[10px] font-semibold text-white", className)}
        style={{ ...box, backgroundColor: bank.color, fontSize: Math.round(size * 0.36) }}
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- local SVG, any size
    <img
      src={`/banks/${bank.slug}.${attempt === 0 ? "png" : "svg"}`}
      alt={bank.name}
      onError={() => setAttempt((a) => a + 1)}
      // Site icons are often transparent and drawn for a light tab bar.
      className={cn("shrink-0 rounded-[10px] bg-white object-contain", className)}
      style={box}
    />
  );
}
