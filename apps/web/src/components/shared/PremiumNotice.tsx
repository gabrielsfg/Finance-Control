"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PREMIUM_UPGRADE_HREF } from "@/lib/config/premium";

const BUTTON_CLASS =
  "inline-flex w-full items-center justify-center gap-2 rounded-[13px] px-[18px] py-2.5 text-[14px] font-semibold transition-transform";

/**
 * The upgrade CTA, in one place so every locked surface sends people to the same
 * destination — and so there is a single line to change when the checkout exists.
 *
 * While there is no destination the button stays visible but inert and says why. An
 * enabled button that goes nowhere is worse than an honest one: it reads as broken.
 */
export function PremiumUpgradeButton({ className }: { className?: string }) {
  if (!PREMIUM_UPGRADE_HREF) {
    return (
      <button
        type="button"
        disabled
        title="A assinatura ainda não está disponível"
        className={cn(BUTTON_CLASS, "cursor-not-allowed opacity-60", className)}
        style={{ background: "var(--surface2)", color: "var(--text-sub)" }}
      >
        <Sparkles size={15} />
        Assinatura em breve
      </button>
    );
  }

  return (
    <Link
      href={PREMIUM_UPGRADE_HREF}
      className={cn(BUTTON_CLASS, "text-white hover:-translate-y-[1px]", className)}
      style={{ background: "var(--brand-cobalt)", boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)" }}
    >
      <Sparkles size={15} />
      Assinar o Premium
    </Link>
  );
}

/**
 * The body a gated card shows to a free account: what the feature does, that it needs
 * Premium, and the way to get it.
 *
 * Cards keep their own shell and header — a free user should see the same card in the
 * same place as a subscriber, just not working. Hiding it entirely means the feature is
 * never discovered, which is the opposite of an upsell.
 */
export function PremiumNotice({
  description,
  preview = true,
}: {
  description: string;
  /** Greyed placeholder lines standing in for the content, so the card keeps its shape. */
  preview?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      {preview && (
        <div aria-hidden className="flex select-none flex-col gap-2 opacity-40">
          <div className="h-3 w-2/3 rounded-full" style={{ background: "var(--text-muted)" }} />
          <div className="h-2.5 w-full rounded-full" style={{ background: "var(--border-color)" }} />
          <div className="h-2.5 w-11/12 rounded-full" style={{ background: "var(--border-color)" }} />
          <div className="h-2.5 w-3/5 rounded-full" style={{ background: "var(--border-color)" }} />
        </div>
      )}

      <div className="flex items-start gap-2.5">
        <div
          className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px]"
          style={{ background: "color-mix(in srgb, var(--gold) 18%, transparent)" }}
        >
          <Lock size={12} style={{ color: "var(--gold)" }} />
        </div>
        <p className="text-[12.5px] leading-relaxed text-[var(--text-sub)]">
          {description}{" "}
          <span className="font-medium text-[var(--text)]">Disponível no plano Premium.</span>
        </p>
      </div>

      <PremiumUpgradeButton />
    </div>
  );
}
