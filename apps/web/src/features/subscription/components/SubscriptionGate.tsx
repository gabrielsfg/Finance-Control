"use client";

import Link from "next/link";
import { AlertCircle, Loader2, Lock, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/shared/Card";
import type { SubscriptionState } from "@/lib/types/subscription.types";
import { useSubscription } from "../hooks/useSubscription";
import { daysUntil, formatBillingDate, formatCents } from "../utils/billing";
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "./BillingDrawer";

/** Routes a user without a subscription can still open: subscribing, and their own profile (export, deletion). */
const OPEN_ROUTES = ["/plans", "/subscription", "/profile"];

/**
 * The paywall on the web side. The API is the real gate (403 SUBSCRIPTION_REQUIRED on
 * every closed endpoint); this replaces the page with the reason and the way out, instead
 * of a screen of failed requests. It fails open while loading or on error — the API
 * still refuses, and a broken subscription call must not lock a paying user out.
 */
export function SubscriptionGate({ pathname, children }: { pathname: string; children: ReactNode }) {
  const { data, isLoading } = useSubscription();
  const isOpenRoute = OPEN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isOpenRoute) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={22} className="text-text-muted animate-spin" />
      </div>
    );
  }

  if (data && !data.hasAccess) return <SubscriptionRequired state={data} />;

  return (
    <>
      {data && <SubscriptionBanner state={data} />}
      {children}
    </>
  );
}

function SubscriptionRequired({ state }: { state: SubscriptionState }) {
  const failed = state.status === "Expired" && state.endReason === "PaymentFailed";
  const pending = state.status === "PendingPayment";

  return (
    <div className="flex h-full items-center justify-center px-5 py-10">
      <Card className="w-full max-w-[460px] text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: `color-mix(in srgb, ${failed ? "var(--clay)" : "var(--gold)"} 16%, transparent)` }}
        >
          {failed ? <AlertCircle size={22} style={{ color: "var(--clay)" }} /> : <Lock size={20} style={{ color: "var(--gold)" }} />}
        </div>
        <h2 className="font-display mb-2 text-[20px] font-bold text-[var(--text)]">
          {failed
            ? "Sua assinatura foi cancelada por falta de pagamento"
            : pending
              ? "Falta confirmar o pagamento"
              : state.status === "Expired"
                ? "Sua assinatura terminou"
                : "Assine para continuar"}
        </h2>
        <p className="mb-5 text-[13.5px] leading-relaxed text-[var(--text-sub)]">
          {failed
            ? "Não recebemos o pagamento da renovação. Seus dados continuam guardados — assine de novo para voltar de onde parou."
            : pending
              ? "Assim que o pagamento for confirmado, o app é liberado automaticamente."
              : "Seus dados continuam guardados e você pode exportá-los no perfil a qualquer momento."}
        </p>
        <div className="flex flex-col gap-2.5">
          <Link href={pending ? "/subscription" : "/plans"} className={PRIMARY_BUTTON_CLASS}>
            <Sparkles size={15} />
            {pending ? "Ver pagamento" : "Ver planos"}
          </Link>
          <Link href="/profile" className={SECONDARY_BUTTON_CLASS}>
            Ir para o perfil
          </Link>
        </div>
      </Card>
    </div>
  );
}

/**
 * Shown on every page while something needs the user: a Pix/boleto renewal coming due
 * (the "remind on every visit" rule for the last days) or a trial about to convert.
 */
function SubscriptionBanner({ state }: { state: SubscriptionState }) {
  let message: string | null = null;
  let tone = "var(--brand-cobalt)";

  if (state.showRenewalReminder && state.pendingCharge) {
    const days = daysUntil(state.currentPeriodEnd) ?? 0;
    message = `Sua assinatura vence ${days <= 0 ? "hoje" : days === 1 ? "amanhã" : `em ${days} dias`}. Pague ${formatCents(state.pendingCharge.amount)} até ${formatBillingDate(state.pendingCharge.dueDate)} para não perder o acesso.`;
    tone = days <= 1 ? "var(--clay)" : "var(--gold)";
  } else if (state.status === "Trialing") {
    const days = daysUntil(state.trialEndsAt);
    if (days !== null && days <= 3) {
      message = `Seu teste grátis termina ${days <= 0 ? "hoje" : days === 1 ? "amanhã" : `em ${days} dias`}. Depois disso, a assinatura é cobrada no cartão.`;
    }
  }

  if (!message) return null;

  return (
    <div
      className="mx-[clamp(20px,3.4vw,46px)] mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[13px] border px-4 py-3 text-[13px]"
      style={{
        background: `color-mix(in srgb, ${tone} 9%, transparent)`,
        borderColor: `color-mix(in srgb, ${tone} 35%, transparent)`,
        color: "var(--text)",
      }}
    >
      <span>{message}</span>
      <Link href="/subscription" className="font-semibold whitespace-nowrap" style={{ color: tone }}>
        {state.showRenewalReminder ? "Pagar agora" : "Gerenciar"}
      </Link>
    </div>
  );
}
