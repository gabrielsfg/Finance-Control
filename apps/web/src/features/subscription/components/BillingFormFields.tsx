"use client";

import type { FieldErrors, Path, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { BILLING_INPUT_CLASS, BillingField } from "./BillingDrawer";
import { maskCardNumber, maskCpf, maskExpiry, maskPhone, maskPostalCode, onlyDigits } from "../utils/billing";
import type { CardWithHolderForm, HolderForm } from "../utils/schemas";

type FormProps<T extends HolderForm> = {
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  errors: FieldErrors<T>;
};

/** Registers a field whose value is rewritten by a mask on every keystroke. */
function masked<T extends HolderForm>(
  { register, setValue }: Pick<FormProps<T>, "register" | "setValue">,
  name: Path<T>,
  mask: (value: string) => string,
) {
  const field = register(name);
  return {
    ...field,
    onChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue(name, mask(e.target.value) as any, { shouldValidate: false, shouldDirty: true });
    },
  };
}

/** CPF, phone and address — Asaas asks for them with every card and for every customer. */
export function HolderFields<T extends HolderForm>(props: FormProps<T> & { cpfLabel?: string }) {
  const errors = props.errors as FieldErrors<HolderForm>;
  return (
    <div className="grid grid-cols-2 gap-3.5">
      <BillingField label={props.cpfLabel ?? "CPF"} htmlFor="billing-cpf" error={errors.cpf?.message} className="col-span-2">
        <input
          id="billing-cpf"
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          className={BILLING_INPUT_CLASS}
          {...masked(props, "cpf" as Path<T>, maskCpf)}
        />
      </BillingField>
      <BillingField label="Celular" htmlFor="billing-phone" error={errors.mobilePhone?.message} className="col-span-2">
        <input
          id="billing-phone"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(11) 98765-4321"
          className={BILLING_INPUT_CLASS}
          {...masked(props, "mobilePhone" as Path<T>, maskPhone)}
        />
      </BillingField>
      <BillingField label="CEP" htmlFor="billing-cep" error={errors.postalCode?.message}>
        <input
          id="billing-cep"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          className={BILLING_INPUT_CLASS}
          {...masked(props, "postalCode" as Path<T>, maskPostalCode)}
        />
      </BillingField>
      <BillingField label="Número" htmlFor="billing-number" error={errors.addressNumber?.message}>
        <input
          id="billing-number"
          autoComplete="off"
          placeholder="123"
          maxLength={20}
          className={BILLING_INPUT_CLASS}
          {...props.register("addressNumber" as Path<T>)}
        />
      </BillingField>
    </div>
  );
}

/**
 * The card itself. Autocomplete hints let the browser's saved cards fill it; nothing
 * typed here is kept anywhere in the app — it goes to our API once and is forgotten.
 */
export function CardFields(props: FormProps<CardWithHolderForm>) {
  const { errors } = props;
  return (
    <div className="grid grid-cols-2 gap-3.5">
      <BillingField label="Número do cartão" htmlFor="card-number" error={errors.number?.message} className="col-span-2">
        <div className="relative">
          <input
            id="card-number"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            className={cn(BILLING_INPUT_CLASS, "pr-10 font-mono tracking-[0.04em]")}
            {...masked(props, "number", maskCardNumber)}
          />
          <CreditCard size={16} className="text-text-muted absolute top-1/2 right-3.5 -translate-y-1/2" />
        </div>
      </BillingField>
      <BillingField label="Nome impresso no cartão" htmlFor="card-holder" error={errors.holderName?.message} className="col-span-2">
        <input
          id="card-holder"
          autoComplete="cc-name"
          placeholder="MARIA S SILVA"
          className={cn(BILLING_INPUT_CLASS, "uppercase")}
          {...props.register("holderName")}
        />
      </BillingField>
      <BillingField label="Validade" htmlFor="card-expiry" error={errors.expiry?.message}>
        <input
          id="card-expiry"
          inputMode="numeric"
          autoComplete="cc-exp"
          placeholder="MM/AA"
          className={cn(BILLING_INPUT_CLASS, "font-mono")}
          {...masked(props, "expiry", maskExpiry)}
        />
      </BillingField>
      <BillingField label="CVV" htmlFor="card-cvv" error={errors.cvv?.message}>
        <input
          id="card-cvv"
          inputMode="numeric"
          autoComplete="cc-csc"
          placeholder="123"
          className={cn(BILLING_INPUT_CLASS, "font-mono")}
          {...masked(props, "cvv", (v) => onlyDigits(v).slice(0, 4))}
        />
      </BillingField>
    </div>
  );
}
