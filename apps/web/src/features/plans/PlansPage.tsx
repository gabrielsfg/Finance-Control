"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, Sparkles } from "lucide-react";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { Card, LedgerRule } from "@/components/shared/Card";
import { Money } from "@/components/shared/Money";
import { TabChips } from "@/components/shared/TabChips";
import { PLAN_FEATURES } from "@/lib/config/premium";
import type { BillingCycle, SubscriptionPlanOption } from "@/lib/types/subscription.types";
import { CheckoutDrawer } from "@/features/subscription/components/CheckoutDrawer";
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "@/features/subscription/components/BillingDrawer";
import { useSubscription, useSubscriptionPlans } from "@/features/subscription/hooks/useSubscription";
import { CYCLE_SUFFIX, formatCents } from "@/features/subscription/utils/billing";

const CYCLES = [
  { id: "Monthly", label: "Mensal" },
  { id: "Yearly", label: "Anual · 2 meses grátis" },
] as const;

export const PlansPage = () => {
  const [cycle, setCycle] = useState<BillingCycle>("Yearly");
  const [checkout, setCheckout] = useState<SubscriptionPlanOption | null>(null);
  const plans = useSubscriptionPlans();
  const subscription = useSubscription();

  const live = subscription.data && subscription.data.status && subscription.data.status !== "Expired";

  if (plans.isLoading || subscription.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={22} className="text-text-muted animate-spin" />
      </div>
    );
  }

  if (!plans.data) {
    return (
      <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
        <PageTopbar title="Planos" />
        <p className="text-[13.5px] text-[var(--clay)]">Não foi possível carregar os planos agora. Tente novamente.</p>
      </div>
    );
  }

  const { trialDays, isTrialEligible } = plans.data;
  const options = plans.data.options.filter((o) => o.cycle === cycle);
  const monthlyOf = (plan: string) =>
    plans.data!.options.find((o) => o.plan === plan && o.cycle === "Monthly")?.price ?? 0;

  return (
    <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
      <PageTopbar
        title="Planos"
        subtitle={
          isTrialEligible && !live
            ? `Comece com ${trialDays} dias grátis no cartão. Cancele quando quiser.`
            : "Escolha o plano que faz sentido para você."
        }
      />

      {live && (
        <Card className="mb-[22px] flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13.5px] text-[var(--text-sub)]">
            Você já tem uma assinatura. Para trocar de plano ou de ciclo, use a página da sua assinatura.
          </p>
          <Link href="/subscription" className={SECONDARY_BUTTON_CLASS}>
            Minha assinatura
          </Link>
        </Card>
      )}

      <TabChips items={CYCLES} value={cycle} onChange={(id) => setCycle(id as BillingCycle)} className="mb-[22px]" />

      <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
        {options.map((option) => {
          const isPremium = option.plan === "Premium";
          const savings = option.cycle === "Yearly" ? monthlyOf(option.plan) * 12 - option.price : 0;
          return (
            <Card
              key={`${option.plan}-${option.cycle}`}
              className="flex flex-col"
              style={isPremium ? { borderColor: "color-mix(in srgb, var(--gold) 45%, transparent)" } : undefined}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-[22px] font-bold text-[var(--text)]">{option.name}</span>
                {isPremium && (
                  <span
                    className="flex items-center gap-1 rounded-full px-[11px] py-[5px] font-mono text-[11px] tracking-[0.06em]"
                    style={{ background: "color-mix(in srgb, var(--gold) 18%, transparent)", color: "var(--gold)" }}
                  >
                    <Sparkles size={12} /> Com IA
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <Money cents={option.price} className="text-[32px]" />
                <span className="text-[13px] text-[var(--text-sub)]">{CYCLE_SUFFIX[option.cycle]}</span>
              </div>
              <p className="mt-1 min-h-[20px] text-[12.5px] text-[var(--text-sub)]">
                {option.cycle === "Yearly"
                  ? `Equivale a ${formatCents(option.monthlyEquivalent)}/mês · economize ${formatCents(savings)} · até ${option.maxInstallments}x no cartão`
                  : "Renova todo mês. Cancele quando quiser."}
              </p>

              <LedgerRule className="my-4" />

              <div className="mb-5 flex flex-1 flex-col gap-2.5">
                {PLAN_FEATURES[option.plan].map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5 text-[13.5px] text-[var(--text)]">
                    <Check size={16} strokeWidth={2.4} className="shrink-0 text-[var(--moss)]" />
                    {feature}
                  </div>
                ))}
              </div>

              {live ? (
                <Link href="/subscription" className={SECONDARY_BUTTON_CLASS}>
                  {subscription.data?.plan === option.plan ? "Seu plano atual" : "Trocar na minha assinatura"}
                </Link>
              ) : (
                <button type="button" onClick={() => setCheckout(option)} className={PRIMARY_BUTTON_CLASS}>
                  <Sparkles size={15} />
                  {isTrialEligible ? `Começar ${trialDays} dias grátis` : `Assinar o ${option.name}`}
                </button>
              )}
            </Card>
          );
        })}
      </div>

      <p className="mt-[22px] text-[12px] leading-relaxed text-[var(--text-muted)]">
        Preços em reais. No cartão, a assinatura renova automaticamente ao fim de cada ciclo e você pode cancelar a
        qualquer momento — o acesso continua até o fim do período já pago. Pix e boleto não têm renovação automática:
        geramos uma nova cobrança antes de cada vencimento. Reembolso integral do primeiro pagamento em até 7 dias.
      </p>

      <CheckoutDrawer
        open={checkout !== null}
        onClose={() => setCheckout(null)}
        option={checkout}
        trialDays={trialDays}
        isTrialEligible={isTrialEligible}
      />
    </div>
  );
};
