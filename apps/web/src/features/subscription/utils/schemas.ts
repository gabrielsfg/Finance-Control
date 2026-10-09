import { z } from "zod/v4";
import { isValidCardNumber, isValidCpf, onlyDigits, parseExpiry } from "./billing";

// Mirror the API validators (CreateSubscriptionValidator / UpdateSubscriptionCardValidator).

export const holderSchema = z.object({
  cpf: z.string().refine(isValidCpf, "CPF inválido"),
  mobilePhone: z.string().refine((v) => [10, 11].includes(onlyDigits(v).length), "Celular inválido"),
  postalCode: z.string().refine((v) => onlyDigits(v).length === 8, "CEP inválido"),
  addressNumber: z.string().trim().min(1, "Informe o número").max(20, "No máximo 20 caracteres"),
});

export const cardSchema = z.object({
  holderName: z.string().trim().min(3, "Nome como está no cartão").max(100, "No máximo 100 caracteres"),
  number: z.string().refine(isValidCardNumber, "Número do cartão inválido"),
  expiry: z.string().refine((v) => parseExpiry(v) !== null, "Validade inválida"),
  cvv: z.string().refine((v) => /^\d{3,4}$/.test(v), "CVV inválido"),
});

export const cardWithHolderSchema = holderSchema.extend(cardSchema.shape);

export type HolderForm = z.infer<typeof holderSchema>;
export type CardWithHolderForm = z.infer<typeof cardWithHolderSchema>;

export const EMPTY_CARD_FORM: CardWithHolderForm = {
  cpf: "",
  mobilePhone: "",
  postalCode: "",
  addressNumber: "",
  holderName: "",
  number: "",
  expiry: "",
  cvv: "",
};

export function toCardPayload(values: CardWithHolderForm) {
  const expiry = parseExpiry(values.expiry)!;
  return {
    cpf: onlyDigits(values.cpf),
    mobilePhone: onlyDigits(values.mobilePhone),
    postalCode: onlyDigits(values.postalCode),
    addressNumber: values.addressNumber.trim(),
    card: {
      holderName: values.holderName.trim(),
      number: onlyDigits(values.number),
      expiryMonth: expiry.month,
      expiryYear: expiry.year,
      cvv: values.cvv,
    },
  };
}
