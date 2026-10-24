"use client";

import { useEffect, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const BILLING_INPUT_CLASS =
  "border-border bg-surface2 text-text placeholder:text-text-muted h-11 w-full rounded-[13px] border px-3.5 text-[15px] outline-none focus:border-[var(--brand-cobalt)]";

export const PRIMARY_BUTTON_CLASS =
  "flex items-center justify-center gap-2 rounded-[13px] bg-[var(--brand-cobalt)] px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50";

export const SECONDARY_BUTTON_CLASS =
  "border-border text-text flex items-center justify-center gap-2 rounded-[13px] border px-4 py-2.5 text-[14px] font-semibold disabled:opacity-50";

/** Right-hand drawer shell shared by the checkout, plan change and card forms. */
export function BillingDrawer({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="anim-fade fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-label={title}
        className="anim-drawer border-border bg-surface fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l shadow-2xl"
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]">
              <Icon size={16} className="text-[var(--brand-accent)]" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-display text-text text-[15px] font-semibold">{title}</h2>
              {subtitle && <p className="text-text-muted text-[12px]">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-text-muted hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </>
  );
}

export function BillingField({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-text-sub text-[13px] font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] text-[var(--clay)]">{error}</p>
      ) : (
        hint && <p className="text-text-muted text-[11.5px]">{hint}</p>
      )}
    </div>
  );
}
