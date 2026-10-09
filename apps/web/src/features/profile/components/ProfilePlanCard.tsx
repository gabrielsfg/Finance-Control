"use client";

import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Card, CardHead, LedgerRule } from "@/components/shared/Card";
import { PLAN_FEATURES } from "@/lib/config/premium";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { CYCLE_SUFFIX, formatBillingDate, formatCents, statusLabel } from "@/features/subscription/utils/billing";

const LINK_CLASS =
  "inline-flex w-full items-center justify-center gap-2 rounded-[13px] px-[18px] py-2.5 text-[14px] font-semibold";

export const ProfilePlanCard = () => {
  const { data: subscription } = useSubscription();
  const live = subscription?.status && subscription.status !== "Expired" ? subscription : null;

  if (!live || !live.plan) {
    return (
      <Card>
        <CardHead title="Plano" />
        <p className="m-0 mb-3.5 text-[13px] text-[var(--text-sub)]">
          {subscription?.endReason === "PaymentFailed"
            ? "Sua assinatura foi cancelada por falta de pagamento. Seus dados continuam guardados."
            : "Você não tem uma assinatura ativa. Seus dados continuam guardados."}
        </p>
        <Link
          href="/plans"
          className={`${LINK_CLASS} text-white`}
          style={{ background: "var(--brand-cobalt)", boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)" }}
        >
          <Sparkles size={15} />
          Ver planos
        </Link>
      </Card>
    );
  }

  const isPremium = live.plan === "Premium";
  return (
    <Card>
      <CardHead title="Plano" />
      <div className="mb-1 flex items-center justify-between">
        <span className="font-display text-[18px] font-bold text-[var(--text)]">{live.plan}</span>
        <span
          className="rounded-full px-[11px] py-[5px] font-mono text-[11px] tracking-[0.06em]"
          style={
            isPremium
              ? { background: "color-mix(in srgb, var(--gold) 18%, transparent)", color: "var(--gold)" }
              : { background: "color-mix(in srgb, var(--moss) 14%, transparent)", color: "var(--moss)" }
          }
        >
          {live.isComplimentary ? "Cortesia" : statusLabel(live)}
        </span>
      </div>
      <p className="m-0 mb-3.5 text-[13px] text-[var(--text-sub)]">
        {live.isComplimentary
          ? `Acesso cortesia até ${formatBillingDate(live.currentPeriodEnd)}.`
          : live.price !== null && live.cycle
            ? `${formatCents(live.price)}${CYCLE_SUFFIX[live.cycle]} · ${live.status === "Canceled" ? "acesso até" : live.status === "Trialing" ? "teste até" : "renova em"} ${formatBillingDate(live.currentPeriodEnd)}`
            : null}
      </p>
      <LedgerRule />
      <div className="my-3.5 flex flex-col gap-2.5">
        {PLAN_FEATURES[live.plan].map((f) => (
          <div key={f} className="flex items-center gap-2.5 text-[13.5px] text-[var(--text)]">
            <Check size={16} strokeWidth={2.4} className="shrink-0 text-[var(--moss)]" />
            {f}
          </div>
        ))}
      </div>
      <Link
        href="/subscription"
        className={`${LINK_CLASS} border border-[var(--border-color)] text-[var(--text)]`}
      >
        Gerenciar assinatura
      </Link>
    </Card>
  );
};
