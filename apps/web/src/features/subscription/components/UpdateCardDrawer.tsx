"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpdateSubscriptionCard } from "../hooks/useSubscription";
import { billingErrorMessage } from "../utils/billing";
import { EMPTY_CARD_FORM, cardWithHolderSchema, toCardPayload, type CardWithHolderForm } from "../utils/schemas";
import { BillingDrawer, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "./BillingDrawer";
import { CardFields, HolderFields } from "./BillingFormFields";
import { TurnstileWidget, isTurnstileEnabled } from "./TurnstileWidget";

/** Replaces the card that renews the subscription. Nothing is charged here. */
export function UpdateCardDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Mounted only while open, so the form never reopens with a card in it.
  if (!open) return null;
  return <UpdateCardContent onClose={onClose} />;
}

function UpdateCardContent({ onClose }: { onClose: () => void }) {
  const update = useUpdateSubscriptionCard();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const { register, setValue, handleSubmit, reset, formState: { errors } } = useForm<CardWithHolderForm>({
    resolver: zodResolver(cardWithHolderSchema),
    defaultValues: EMPTY_CARD_FORM,
  });

  const onSubmit = handleSubmit((values) =>
    update.mutate(
      { ...toCardPayload(values), captchaToken: captchaToken ?? undefined },
      {
        onSuccess: () => {
          setDone(true);
          reset(EMPTY_CARD_FORM);
        },
      },
    ),
  );

  return (
    <BillingDrawer open onClose={onClose} title="Trocar cartão" subtitle="As próximas cobranças usam o novo cartão" icon={CreditCard}>
      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <h3 className="font-display text-text text-[17px] font-bold">Cartão atualizado</h3>
          <p className="text-text-sub text-[13.5px]">A próxima renovação será cobrada no novo cartão.</p>
          <button type="button" onClick={onClose} className={`${PRIMARY_BUTTON_CLASS} px-6`}>
            Fechar
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-5">
          <CardFields register={register} setValue={setValue} errors={errors} />
          <HolderFields register={register} setValue={setValue} errors={errors} cpfLabel="CPF do titular do cartão" />
          <TurnstileWidget onToken={setCaptchaToken} />
          {update.isError && <p className="text-[12.5px] text-[var(--clay)]">{billingErrorMessage(update.error)}</p>}
          <div className="border-border mt-auto flex gap-2.5 border-t pt-4">
            <button type="button" onClick={onClose} className={cn(SECONDARY_BUTTON_CLASS, "flex-1")}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={update.isPending || (isTurnstileEnabled && !captchaToken)}
              className={cn(PRIMARY_BUTTON_CLASS, "flex-1")}
            >
              {update.isPending && <Loader2 size={15} className="animate-spin" />}
              Salvar cartão
            </button>
          </div>
        </div>
      )}
    </BillingDrawer>
  );
}
