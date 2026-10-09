"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightLeft, CreditCard, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { Card, CardHead, LedgerRule } from "@/components/shared/Card";
import { Money } from "@/components/shared/Money";
import { cn } from "@/lib/utils";
import type { SubscriptionState } from "@/lib/types/subscription.types";
import {
  useCancelSubscription,
  useRefundSubscription,
  useResumeSubscription,
  useSubscription,
} from "./hooks/useSubscription";
import {
  CHARGE_STATUS_LABEL,
  CYCLE_LABEL,
  CYCLE_SUFFIX,
  METHOD_LABEL,
  billingErrorMessage,
  formatBillingDate,
  formatCents,
  statusLabel,
} from "./utils/billing";
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "./components/BillingDrawer";
import { ChangePlanDrawer } from "./components/ChangePlanDrawer";
import { ConfirmBillingActionDialog } from "./components/ConfirmBillingActionDialog";
import { PendingPaymentPanel } from "./components/PendingPaymentPanel";
import { UpdateCardDrawer } from "./components/UpdateCardDrawer";

export const SubscriptionPage = () => {
  const { data: subscription, isLoading, isError } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={22} className="text-text-muted animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
      <PageTopbar title="Minha assinatura" subtitle={subscription ? statusLabel(subscription) : undefined} />
      {isError || !subscription ? (
        <p className="text-[13.5px] text-[var(--clay)]">Não foi possível carregar sua assinatura agora.</p>
      ) : !subscription.status || subscription.status === "Expired" ? (
        <NoSubscription subscription={subscription} />
      ) : (
        <LiveSubscription subscription={subscription} />
      )}
    </div>
  );
};

function NoSubscription({ subscription }: { subscription: SubscriptionState }) {
  const failed = subscription.endReason === "PaymentFailed";
  return (
    <Card className="max-w-[560px]">
      <CardHead title={subscription.status ? statusLabel(subscription) : "Você ainda não assina"} />
      <p className="mb-4 text-[13.5px] leading-relaxed text-[var(--text-sub)]">
        {failed
          ? "Não recebemos o pagamento da renovação, então a assinatura foi cancelada. Seus dados continuam guardados — é só assinar de novo para voltar."
          : subscription.endReason === "Refunded"
            ? "O reembolso foi solicitado e a assinatura foi encerrada. Seus dados continuam guardados."
            : subscription.status
              ? `Sua assinatura terminou em ${formatBillingDate(subscription.endedAt)}. Seus dados continuam guardados.`
              : "Assine para usar o app. Você pode exportar seus dados a qualquer momento no perfil."}
      </p>
      <Link href="/plans" className={PRIMARY_BUTTON_CLASS}>
        <Sparkles size={15} />
        Ver planos
      </Link>
    </Card>
  );
}

function LiveSubscription({ subscription }: { subscription: SubscriptionState }) {
  const [changingPlan, setChangingPlan] = useState(false);
  const [changingCard, setChangingCard] = useState(false);
  const [confirm, setConfirm] = useState<"cancel" | "refund" | null>(null);
  const cancel = useCancelSubscription();
  const resume = useResumeSubscription();
  const refund = useRefundSubscription();

  const isTrial = subscription.status === "Trialing";
  const isCanceled = subscription.status === "Canceled";
  const isPending = subscription.status === "PendingPayment";
  const isCard = subscription.billingMethod === "CreditCard";
  const price = subscription.price ?? 0;
  const cycle = subscription.cycle ?? "Monthly";
  const nextChargeAmount = subscription.pendingChange?.price ?? price;

  const action = confirm === "cancel" ? cancel : refund;

  return (
    <div className="grid grid-cols-12 gap-[22px]">
      <div className="col-span-12 flex flex-col gap-[22px] lg:col-span-8">
        <Card>
          <CardHead title="Plano" />
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <span className="font-display text-[22px] font-bold text-[var(--text)]">
              {subscription.plan} · {CYCLE_LABEL[cycle]}
            </span>
            <StatusPill subscription={subscription} />
          </div>
          {!subscription.isComplimentary && (
            <div className="flex items-baseline gap-1">
              <Money cents={price} className="text-[24px]" />
              <span className="text-[13px] text-[var(--text-sub)]">
                {CYCLE_SUFFIX[cycle]}
                {subscription.installmentCount > 1 && ` em ${subscription.installmentCount}x`}
              </span>
            </div>
          )}

          <LedgerRule className="my-4" />

          <div className="grid grid-cols-1 gap-3 text-[13.5px] sm:grid-cols-2">
            <Info label={isTrial ? "Teste grátis até" : isCanceled ? "Acesso até" : "Período atual até"} value={formatBillingDate(subscription.currentPeriodEnd)} />
            {!isCanceled && !isPending && !subscription.isComplimentary && (
              <Info
                label={isCard ? "Próxima cobrança" : "Próximo vencimento"}
                value={`${formatBillingDate(subscription.currentPeriodEnd)} · ${formatCents(nextChargeAmount)}`}
              />
            )}
            {subscription.billingMethod && !subscription.isComplimentary && (
              <Info
                label="Forma de pagamento"
                value={
                  isCard && subscription.cardLast4
                    ? `${subscription.cardBrand ?? "Cartão"} final ${subscription.cardLast4}`
                    : METHOD_LABEL[subscription.billingMethod]
                }
              />
            )}
            {subscription.pendingChange && (
              <Info
                label="Troca agendada"
                value={`${subscription.pendingChange.plan} ${CYCLE_LABEL[subscription.pendingChange.cycle].toLowerCase()} · ${formatCents(subscription.pendingChange.price)} a partir de ${formatBillingDate(subscription.pendingChange.effectiveAt)}`}
              />
            )}
          </div>

          {isTrial && (
            <p className="mt-4 rounded-[13px] p-3 text-[12.5px] leading-relaxed text-[var(--text-sub)]" style={{ background: "color-mix(in srgb, var(--brand-cobalt) 7%, transparent)" }}>
              Em {formatBillingDate(subscription.trialEndsAt)} cobraremos {formatCents(nextChargeAmount)} no cartão. Cancele antes
              dessa data e nada será cobrado.
            </p>
          )}

          {isCanceled && (
            <p className="mt-4 text-[12.5px] text-[var(--text-sub)]">
              Nada mais será cobrado. Mudou de ideia? Você pode retomar até {formatBillingDate(subscription.currentPeriodEnd)}.
            </p>
          )}

          {!subscription.isComplimentary && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              {isCanceled ? (
                subscription.canResume && (
                  <button type="button" onClick={() => resume.mutate()} disabled={resume.isPending} className={PRIMARY_BUTTON_CLASS}>
                    {resume.isPending ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                    Retomar assinatura
                  </button>
                )
              ) : (
                <>
                  {!isPending && (
                    <button type="button" onClick={() => setChangingPlan(true)} className={SECONDARY_BUTTON_CLASS}>
                      <ArrowRightLeft size={15} />
                      Trocar plano
                    </button>
                  )}
                  {isCard && !isPending && (
                    <button type="button" onClick={() => setChangingCard(true)} className={SECONDARY_BUTTON_CLASS}>
                      <CreditCard size={15} />
                      Trocar cartão
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirm("cancel")}
                    className={cn(SECONDARY_BUTTON_CLASS, "text-[var(--clay)]")}
                  >
                    Cancelar assinatura
                  </button>
                </>
              )}
              {subscription.canRequestRefund && (
                <button type="button" onClick={() => setConfirm("refund")} className={cn(SECONDARY_BUTTON_CLASS, "text-[var(--clay)]")}>
                  Pedir reembolso
                </button>
              )}
            </div>
          )}
          {resume.isError && <p className="mt-3 text-[12.5px] text-[var(--clay)]">{billingErrorMessage(resume.error)}</p>}
        </Card>

        <ChargesCard subscription={subscription} />
      </div>

      <div className="col-span-12 flex flex-col gap-[22px] lg:col-span-4">
        {subscription.pendingCharge && (
          <Card>
            <CardHead title={isPending ? "Pagamento pendente" : "Renovação"} />
            <PendingPaymentPanel charge={subscription.pendingCharge} />
          </Card>
        )}
        <Card>
          <CardHead title="Seus direitos" />
          <ul className="flex list-disc flex-col gap-2 pl-4 text-[12.5px] leading-relaxed text-[var(--text-sub)]">
            <li>Cancele a qualquer momento, em um clique. O acesso continua até o fim do período já pago.</li>
            <li>Reembolso integral do primeiro pagamento em até 7 dias.</li>
            <li>Seus dados continuam disponíveis para exportação mesmo sem assinatura.</li>
          </ul>
        </Card>
      </div>

      <ChangePlanDrawer open={changingPlan} onClose={() => setChangingPlan(false)} subscription={subscription} />
      <UpdateCardDrawer open={changingCard} onClose={() => setChangingCard(false)} />
      <ConfirmBillingActionDialog
        open={confirm !== null}
        title={confirm === "refund" ? "Pedir reembolso?" : "Cancelar assinatura?"}
        description={
          confirm === "refund"
            ? `Vamos estornar ${formatCents(subscription.charges.find((c) => c.status === "Confirmed")?.amount ?? price)} e encerrar a assinatura agora. Seus dados continuam guardados.`
            : isTrial
              ? `Nada será cobrado. Você continua com acesso até ${formatBillingDate(subscription.currentPeriodEnd)}.`
              : isPending
                ? "A cobrança em aberto será cancelada."
                : `Nada mais será cobrado. Você continua com acesso até ${formatBillingDate(subscription.currentPeriodEnd)}.`
        }
        confirmLabel={confirm === "refund" ? "Pedir reembolso" : "Cancelar assinatura"}
        pending={action.isPending}
        error={action.isError ? billingErrorMessage(action.error) : null}
        onConfirm={() => action.mutate(undefined, { onSuccess: () => setConfirm(null) })}
        onClose={() => {
          setConfirm(null);
          cancel.reset();
          refund.reset();
        }}
      />
    </div>
  );
}

function StatusPill({ subscription }: { subscription: SubscriptionState }) {
  const color =
    subscription.status === "Active" || subscription.status === "Trialing"
      ? "var(--moss)"
      : subscription.status === "Canceled"
        ? "var(--gold)"
        : "var(--text-sub)";
  return (
    <span
      className="rounded-full px-[11px] py-[5px] font-mono text-[11px] tracking-[0.06em]"
      style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
    >
      {subscription.isComplimentary ? "Cortesia" : statusLabel(subscription)}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10.5px] tracking-[0.08em] text-[var(--text-muted)] uppercase">{label}</span>
      <span className="text-[var(--text)]">{value}</span>
    </div>
  );
}

function ChargesCard({ subscription }: { subscription: SubscriptionState }) {
  if (subscription.charges.length === 0) return null;
  return (
    <Card>
      <CardHead title="Pagamentos" />
      <div className="flex flex-col">
        {subscription.charges.map((charge, index) => (
          <div
            key={charge.id}
            className={cn(
              "flex items-center justify-between gap-3 py-3 text-[13.5px]",
              index > 0 && "border-t border-[var(--border-color)]",
            )}
          >
            <div className="flex flex-col">
              <span className="text-[var(--text)]">
                {charge.plan} {CYCLE_LABEL[charge.cycle].toLowerCase()} · {METHOD_LABEL[charge.billingMethod]}
                {charge.installmentCount > 1 && ` · ${charge.installmentCount}x`}
              </span>
              <span className="text-[12px] text-[var(--text-muted)]">
                {formatBillingDate(charge.confirmedAt ?? charge.dueDate)} · {CHARGE_STATUS_LABEL[charge.status]}
              </span>
            </div>
            <Money cents={charge.amount} className="text-[15px]" />
          </div>
        ))}
      </div>
    </Card>
  );
}
