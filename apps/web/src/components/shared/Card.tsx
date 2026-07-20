import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Card base — surface, hairline border, 20px radius, soft shadow, 22px padding. */
export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)] p-[22px]", className)}
      style={{ boxShadow: "var(--shadow-sm)", ...style }}
    >
      {children}
    </div>
  );
}

/**
 * Card header: display title (+ optional sub) on the left, an action on the right.
 * Right slot is either a standard mono-uppercase accent link (`href`) or custom `right`.
 */
export function CardHead({
  title,
  subtitle,
  href,
  linkLabel = "Ver tudo",
  right,
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center gap-2.5", className)}>
      <div className="min-w-0">
        <h3 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">{title}</h3>
        {subtitle && <p className="text-[12.5px] text-[var(--text-sub)]">{subtitle}</p>}
      </div>
      {right ? (
        <div className="ml-auto flex items-center gap-2">{right}</div>
      ) : href ? (
        <Link
          href={href}
          className="ml-auto font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--brand-accent)] hover:underline"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

/** Dotted "ledger rule" hairline used under figures. */
export function LedgerRule({ className }: { className?: string }) {
  return (
    <div
      className={cn("my-3.5 h-px", className)}
      style={{
        background:
          "repeating-linear-gradient(90deg, var(--border-color) 0 6px, transparent 6px 11px)",
      }}
    />
  );
}
