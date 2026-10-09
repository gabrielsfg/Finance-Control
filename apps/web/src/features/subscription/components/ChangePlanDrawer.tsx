"use client";

import { useState } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PillSelect } from "@/components/shared/PillSelect";
import type {
  BillingCycle,
  ChangeSubscriptionPlanResponse,
  SubscriptionPlan,
  SubscriptionState,
} from "@/lib/types/subscription.types";
import { useChangeSubscriptionPlan, useSubscriptionPlans } from "../hooks/useSubscription";
import { CYCLE_LABEL, CYCLE_SUFFIX, billingErrorMessage, formatBillingDate, formatCents } from "../utils/billing";
import { BillingDrawer, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "./BillingDrawer";

/**
 * Plan or cycle change in two steps: a preview from the API (new price, when it is
 * first charged, whether it unlocks now), then the confirmation. Nothing changes and
 * nothing is charged until the user confirms what they saw.
 */
export function ChangePlanDrawer({
  open,
  onClose,
  subscription,
}: {
  open: boolean;
  onClose: () => void;
  subscription: SubscriptionState;
}) {
  // Mounted only while open, so each open starts from the current plan.
  if (!open) return null;
  return <ChangePlanContent onClose={onClose} subscription={subscription} />;
}

function ChangePlanContent({ onClose, subscription }: { onClose: () => void; subscription: SubscriptionState }) {
  const plans = useSubscriptionPlans();
  const change = useChangeSubscriptionPlan();
  const [plan, setPlan] = useState<SubscriptionPlan>(subscription.pendingChange?.plan ?? subscription.plan ?? "Basic");
  const [cycle, setCycle] = useState<BillingCycle>(subscription.pendingChange?.cycle ?? subscription.cycle ?? "Monthly");
  const [installments, setInstallments] = useState(
    String(subscription.pendingChange?.installmentCount ?? subscription.installmentCount ?? 1),
  );
  const [preview, setPreview] = useState<ChangeSubscriptionPlanResponse | null>(null);
  const [done, setDone] = useState(false);

  const canSplit = subscription.billingMethod === "CreditCard" && cycle === "Yearly";
  const option = plans.data?.options.find((o) => o.plan === plan && o.cycle === cycle);
  const installmentCount = canSplit ? Number(installments) : 1;

  const request = (confirm: boolean) =>
    change.mutate(
      { plan, cycle, installmentCount, confirm },
      {
        onSuccess: (result) => {
          if (result.applied) setDone(true);
          else setPreview(result);
        },
      },
    );

  const choose = (next: () => void) => {
    next();
    setPreview(null);
    change.reset();
  };

  return (
    <BillingDrawer open onClose={onClose} title="Trocar de plano" subtitle="Veja o novo valor antes de confirmar" icon={ArrowRightLeft}>
      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <h3 className="font-display text-text text-[17px] font-bold">Plano atualizado</h3>
          <p className="text-text-sub text-[13.5px]">A mudança já está na sua assinatura.</p>
          <button type="button" onClick={onClose} className={`${PRIMARY_BUTTON_CLASS} px-6`}>
            Fechar
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-text-sub text-[13px] font-medium">Plano</span>
            <div className="grid grid-cols-2 gap-2">
              {(["Basic", "Premium"] as const).map((p) => (
                <OptionButton key={p} active={plan === p} onClick={() => choose(() => setPlan(p))}>
                  {p}
                </OptionButton>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-text-sub text-[13px] font-medium">Ciclo</span>
            <div className="grid grid-cols-2 gap-2">
              {(["Monthly", "Yearly"] as const).map((c) => (
                <OptionButton key={c} active={cycle === c} onClick={() => choose(() => setCycle(c))}>
                  {CYCLE_LABEL[c]}
                </OptionButton>
              ))}
            </div>
          </div>

          {canSplit && option && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-text-sub text-[13px] font-medium">Parcelas</span>
              <PillSelect
                active={false}
                value={installments}
                onChange={(v) => choose(() => setInstallments(v))}
                options={Array.from({ length: option.maxInstallments }, (_, i) => ({
                  value: String(i + 1),
                  label: i === 0 ? "À vista" : `${i + 1}x de ${formatCents(Math.round(option.price / (i + 1)))}`,
                }))}
              />
            </div>
          )}

          {preview && (
            <div
              className="rounded-[13px] p-3.5 text-[13px] leading-relaxed text-[var(--text-sub)]"
              style={{ background: "color-mix(in srgb, var(--brand-cobalt) 7%, transparent)" }}
            >
              <p>
                Novo valor: <strong className="text-[var(--text)]">{formatCents(preview.price)}{CYCLE_SUFFIX[preview.cycle]}</strong>
                {preview.installmentCount > 1 && ` em ${preview.installmentCount}x`}, cobrado a partir de{" "}
                <strong className="text-[var(--text)]">{formatBillingDate(preview.nextChargeAt)}</strong>.
              </p>
              <p className="mt-1.5">
                {preview.planAppliesNow
                  ? `O plano ${preview.plan} vale a partir de agora.`
                  : `Até lá, você continua no plano atual.`}{" "}
                Nada é cobrado hoje.
              </p>
            </div>
          )}

          {change.isError && <p className="text-[12.5px] text-[var(--clay)]">{billingErrorMessage(change.error)}</p>}

          <div className="border-border mt-auto flex gap-2.5 border-t pt-4">
            <button type="button" onClick={onClose} className={cn(SECONDARY_BUTTON_CLASS, "flex-1")}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => request(preview !== null)}
              disabled={change.isPending}
              className={cn(PRIMARY_BUTTON_CLASS, "flex-1")}
            >
              {change.isPending && <Loader2 size={15} className="animate-spin" />}
              {preview ? "Confirmar troca" : "Ver novo valor"}
            </button>
          </div>
        </div>
      )}
    </BillingDrawer>
  );
}

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-[13px] border px-3 py-2.5 text-[14px] font-semibold transition-colors",
        active
          ? "border-[color-mix(in_srgb,var(--brand-cobalt)_55%,transparent)] bg-[color-mix(in_srgb,var(--brand-cobalt)_10%,transparent)] text-[var(--text)]"
          : "border-border bg-surface2 text-text-sub hover:border-[var(--text-muted)]",
      )}
    >
      {children}
    </button>
  );
}
