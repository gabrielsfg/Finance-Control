"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Barcode, Check, CreditCard, Loader2, QrCode, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PillSelect } from "@/components/shared/PillSelect";
import type {
  BillingMethod,
  SubscriptionPlanOption,
  SubscriptionState,
} from "@/lib/types/subscription.types";
import { useCreateSubscription } from "../hooks/useSubscription";
import {
  CYCLE_SUFFIX,
  billingErrorMessage,
  formatBillingDate,
  formatCents,
  onlyDigits,
} from "../utils/billing";
import {
  EMPTY_CARD_FORM,
  cardWithHolderSchema,
  holderSchema,
  toCardPayload,
  type CardWithHolderForm,
} from "../utils/schemas";
import { BillingDrawer, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "./BillingDrawer";
import { CardFields, HolderFields } from "./BillingFormFields";
import { PendingPaymentPanel } from "./PendingPaymentPanel";
import { TurnstileWidget, isTurnstileEnabled } from "./TurnstileWidget";

type Props = {
  open: boolean;
  onClose: () => void;
  option: SubscriptionPlanOption | null;
  trialDays: number;
  isTrialEligible: boolean;
};

const METHODS: { value: BillingMethod; label: string; Icon: typeof CreditCard }[] = [
  { value: "CreditCard", label: "Cartão", Icon: CreditCard },
  { value: "Pix", label: "Pix", Icon: QrCode },
  { value: "Boleto", label: "Boleto", Icon: Barcode },
];

export function CheckoutDrawer(props: Props) {
  // Mounted only while open, so every open starts clean: a drawer that reopens with
  // the last card typed in is both confusing and a card number left on screen.
  if (!props.open || !props.option) return null;
  return <CheckoutContent {...props} option={props.option} />;
}

function CheckoutContent({ open, onClose, option, trialDays, isTrialEligible }: Props & { option: SubscriptionPlanOption }) {
  const [method, setMethod] = useState<BillingMethod>("CreditCard");
  const [installments, setInstallments] = useState("1");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [result, setResult] = useState<SubscriptionState | null>(null);
  const create = useCreateSubscription();

  // The card fields are only required when paying by card; the resolver reads the
  // current method through a ref so one form serves all three.
  const methodRef = useRef(method);
  useEffect(() => {
    methodRef.current = method;
  }, [method]);
  const resolver: Resolver<CardWithHolderForm> = (values, context, options) =>
    (methodRef.current === "CreditCard"
      ? zodResolver(cardWithHolderSchema)
      : zodResolver(holderSchema as unknown as typeof cardWithHolderSchema))(values, context, options);

  const { register, setValue, handleSubmit, formState: { errors } } = useForm<CardWithHolderForm>({
    resolver,
    defaultValues: EMPTY_CARD_FORM,
  });
  const [trialEnd] = useState(() => new Date(Date.now() + trialDays * 86_400_000).toISOString());

  const isCard = method === "CreditCard";
  const withTrial = isCard && isTrialEligible;
  const canSplit = isCard && option.cycle === "Yearly";
  const installmentCount = canSplit ? Number(installments) : 1;
  const price = `${formatCents(option.price)}${CYCLE_SUFFIX[option.cycle]}`;
  const cycleWord = option.cycle === "Yearly" ? "ano" : "mês";

  const installmentOptions = Array.from({ length: option.maxInstallments }, (_, i) => {
    const n = i + 1;
    return {
      value: String(n),
      label: n === 1 ? `À vista — ${formatCents(option.price)}` : `${n}x de ${formatCents(Math.round(option.price / n))}`,
    };
  });

  const onSubmit = handleSubmit((values) => {
    const payload = toCardPayload(values);
    create.mutate(
      {
        plan: option.plan,
        cycle: option.cycle,
        billingMethod: method,
        installmentCount,
        cpf: payload.cpf,
        mobilePhone: payload.mobilePhone,
        postalCode: payload.postalCode,
        addressNumber: payload.addressNumber,
        card: isCard ? payload.card : undefined,
        captchaToken: captchaToken ?? undefined,
      },
      {
        onSuccess: (state) => {
          setResult(state);
          // The card is gone from the form the moment it has been used.
          setValue("number", "");
          setValue("cvv", "");
        },
      },
    );
  });

  const submitDisabled = create.isPending || (isTurnstileEnabled && !captchaToken);

  return (
    <BillingDrawer
      open={open}
      onClose={onClose}
      title={`Assinar o ${option.name}`}
      subtitle={`${option.cycle === "Yearly" ? "Plano anual" : "Plano mensal"} · ${price}`}
      icon={Sparkles}
    >
      {result ? (
        <CheckoutResult state={result} onClose={onClose} />
      ) : (
        <div className="flex flex-1 flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-text-sub text-[13px] font-medium">Forma de pagamento</span>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map(({ value, label, Icon }) => {
                const active = method === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMethod(value)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-[13px] border px-3 py-3 text-[13px] font-semibold transition-colors",
                      active
                        ? "border-[color-mix(in_srgb,var(--brand-cobalt)_55%,transparent)] bg-[color-mix(in_srgb,var(--brand-cobalt)_10%,transparent)] text-[var(--text)]"
                        : "border-border bg-surface2 text-text-sub hover:border-[var(--text-muted)]",
                    )}
                  >
                    <Icon size={17} className={active ? "text-[var(--brand-accent)]" : undefined} />
                    {label}
                  </button>
                );
              })}
            </div>
            {!isCard && isTrialEligible && (
              <p className="text-text-muted text-[11.5px]">O teste grátis de {trialDays} dias vale para pagamento com cartão.</p>
            )}
          </div>

          {isCard && <CardFields register={register} setValue={setValue} errors={errors} />}

          <HolderFields
            register={register}
            setValue={setValue}
            errors={errors}
            cpfLabel={isCard ? "CPF do titular do cartão" : "CPF"}
          />

          {canSplit && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-text-sub text-[13px] font-medium">Parcelas</span>
              <PillSelect options={installmentOptions} value={installments} onChange={setInstallments} active={false} />
            </div>
          )}

          <div
            className="rounded-[13px] p-3.5 text-[12.5px] leading-relaxed text-[var(--text-sub)]"
            style={{ background: "color-mix(in srgb, var(--brand-cobalt) 7%, transparent)" }}
          >
            {withTrial ? (
              <>
                <strong className="text-[var(--text)]">Grátis por {trialDays} dias.</strong> Em {formatBillingDate(trialEnd)}{" "}
                cobraremos automaticamente {installmentCount > 1 ? `${installmentCount}x de ${formatCents(Math.round(option.price / installmentCount))}` : price}{" "}
                no cartão e a assinatura renova a cada {cycleWord}. Cancele antes dessa data, em um clique, e nada é cobrado.
                Avisamos por e-mail 3 dias antes.
              </>
            ) : isCard ? (
              <>
                <strong className="text-[var(--text)]">Cobrança de {formatCents(option.price)} hoje</strong>
                {installmentCount > 1 && ` em ${installmentCount}x de ${formatCents(Math.round(option.price / installmentCount))}`}, com renovação
                automática a cada {cycleWord} no cartão. Cancele quando quiser.
              </>
            ) : (
              <>
                <strong className="text-[var(--text)]">Pagamento de {formatCents(option.price)} agora.</strong> A cada {cycleWord},
                geramos uma nova cobrança por {method === "Pix" ? "Pix" : "boleto"} e avisamos você nos 5 dias antes do vencimento.
                Sem o pagamento até o vencimento, a assinatura é cancelada.
              </>
            )}{" "}
            Em até 7 dias após o primeiro pagamento, você pode pedir o reembolso integral.
          </div>

          <TurnstileWidget onToken={setCaptchaToken} />

          {create.isError && <p className="text-[12.5px] text-[var(--clay)]">{billingErrorMessage(create.error)}</p>}

          <div className="border-border mt-auto flex flex-col gap-2.5 border-t pt-4">
            <button type="button" onClick={onSubmit} disabled={submitDisabled} className={PRIMARY_BUTTON_CLASS}>
              {create.isPending && <Loader2 size={15} className="animate-spin" />}
              {withTrial ? `Começar ${trialDays} dias grátis` : isCard ? "Assinar e pagar" : `Gerar ${method === "Pix" ? "Pix" : "boleto"}`}
            </button>
            <p className="text-text-muted flex items-center justify-center gap-1.5 text-[11.5px]">
              <ShieldCheck size={13} />
              Pagamento processado pelo Asaas. Não guardamos os dados do seu cartão.
            </p>
          </div>
        </div>
      )}
    </BillingDrawer>
  );
}

function CheckoutResult({ state, onClose }: { state: SubscriptionState; onClose: () => void }) {
  if (state.status === "PendingPayment" && state.pendingCharge) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-display text-text text-[17px] font-bold">Falta só o pagamento</h3>
          <p className="text-text-sub text-[13px]">Assim que ele for confirmado, seu acesso é liberado.</p>
        </div>
        <PendingPaymentPanel charge={state.pendingCharge} />
        <Link href="/subscription" onClick={onClose} className={SECONDARY_BUTTON_CLASS}>
          Ver minha assinatura
        </Link>
      </div>
    );
  }

  const processing = state.status === "PendingPayment";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--moss)_14%,transparent)]">
        {processing ? (
          <Loader2 size={24} className="animate-spin text-[var(--moss)]" />
        ) : (
          <Check size={26} className="text-[var(--moss)]" strokeWidth={2.2} />
        )}
      </div>
      <h3 className="font-display text-text text-[17px] font-bold">
        {state.status === "Trialing" ? "Teste grátis ativado" : processing ? "Processando o pagamento" : "Assinatura ativa"}
      </h3>
      <p className="text-text-sub text-[13.5px] leading-relaxed">
        {state.status === "Trialing"
          ? `Aproveite tudo até ${formatBillingDate(state.trialEndsAt)}. A primeira cobrança acontece nessa data, se você não cancelar.`
          : processing
            ? "O pagamento está em análise. Avisamos por e-mail assim que for confirmado."
            : `Tudo certo! Seu acesso vai até ${formatBillingDate(state.currentPeriodEnd)} e renova automaticamente.`}
      </p>
      {state.cardLast4 && (
        <p className="text-text-muted font-mono text-[12px]">Cartão final {onlyDigits(state.cardLast4)}</p>
      )}
      <Link href="/dashboard" onClick={onClose} className={`${PRIMARY_BUTTON_CLASS} mt-2 px-6`}>
        Ir para o app
      </Link>
    </div>
  );
}
