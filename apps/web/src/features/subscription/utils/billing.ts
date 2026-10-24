import type {
  BillingCycle,
  BillingMethod,
  ChargeStatus,
  SubscriptionPlan,
  SubscriptionState,
} from "@/lib/types/subscription.types";

// ---- display ------------------------------------------------------------------------

export const PLAN_LABEL: Record<SubscriptionPlan, string> = { Basic: "Basic", Premium: "Premium" };
export const CYCLE_LABEL: Record<BillingCycle, string> = { Monthly: "Mensal", Yearly: "Anual" };
export const CYCLE_SUFFIX: Record<BillingCycle, string> = { Monthly: "/mês", Yearly: "/ano" };
export const METHOD_LABEL: Record<BillingMethod, string> = {
  CreditCard: "Cartão de crédito",
  Pix: "Pix",
  Boleto: "Boleto",
};
export const CHARGE_STATUS_LABEL: Record<ChargeStatus, string> = {
  Creating: "Processando",
  Pending: "Aguardando pagamento",
  Confirmed: "Pago",
  Failed: "Recusado",
  Refunded: "Estornado",
  Canceled: "Cancelado",
};

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Cents → "R$ 34,99". */
export const formatCents = (cents: number) => BRL.format(cents / 100);

/** ISO instant or YYYY-MM-DD → "07/11/2026", in Brasília time like the due dates. */
export function formatBillingDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

export function statusLabel(state: SubscriptionState): string {
  switch (state.status) {
    case "Trialing":
      return "Teste grátis";
    case "PendingPayment":
      return "Aguardando pagamento";
    case "Active":
      return "Ativa";
    case "Canceled":
      return "Cancelada";
    case "Expired":
      return state.endReason === "PaymentFailed" ? "Cancelada por falta de pagamento" : "Encerrada";
    default:
      return "Sem assinatura";
  }
}

// ---- masks --------------------------------------------------------------------------

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

export function maskCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskPostalCode(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function maskCardNumber(value: string): string {
  return onlyDigits(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function maskExpiry(value: string): string {
  const d = onlyDigits(value).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

// ---- validation (mirrors the API validators, so the form never sends what bounces) ----

export function isValidCpf(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(d[i]) * (length + 1 - i);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return Number(d[9]) === digit(9) && Number(d[10]) === digit(10);
}

export function isValidCardNumber(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** "MM/AA" → { month: "MM", year: "20AA" } or null when malformed or in the past. */
export function parseExpiry(value: string): { month: string; year: string } | null {
  const d = onlyDigits(value);
  if (d.length !== 4) return null;
  const month = Number(d.slice(0, 2));
  const year = 2000 + Number(d.slice(2));
  if (month < 1 || month > 12) return null;
  const now = new Date();
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return null;
  return { month: d.slice(0, 2), year: String(year) };
}

// ---- errors -------------------------------------------------------------------------

const ERROR_MESSAGES: Record<string, string> = {
  ALREADY_SUBSCRIBED: "Você já tem uma assinatura ativa.",
  NO_SUBSCRIPTION: "Você não tem uma assinatura ativa.",
  CARD_DECLINED: "O cartão foi recusado. Confira os dados ou tente outro cartão.",
  CARD_ATTEMPTS_EXCEEDED: "Muitas tentativas com cartão hoje. Tente novamente amanhã ou use Pix.",
  CAPTCHA_FAILED: "Não conseguimos confirmar que você não é um robô. Recarregue a página e tente de novo.",
  GATEWAY_UNAVAILABLE: "O processador de pagamentos não respondeu. Aguarde alguns minutos — se algo foi cobrado, aparece na sua assinatura.",
  GATEWAY_REJECTED: "O processador de pagamentos recusou a operação. Confira os dados e tente novamente.",
  NOT_REFUNDABLE: "O reembolso só vale para o primeiro pagamento, em até 7 dias.",
  NOT_RESUMABLE: "Esta assinatura não pode mais ser retomada.",
  NOT_CANCELABLE: "Esta assinatura não pode ser cancelada agora.",
  PLAN_CHANGE_NOT_ALLOWED: "A troca de plano não está disponível para esta assinatura.",
  NOTHING_TO_CHANGE: "Esse já é o seu plano.",
  NOT_PAID_BY_CARD: "Sua assinatura não é paga com cartão.",
  NO_PENDING_PIX: "Não há cobrança Pix em aberto.",
};

/** The pt-BR message for a failed billing request: our error code, a validation message, or a fallback. */
export function billingErrorMessage(err: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  const response = (err as { response?: { status?: number; data?: unknown } })?.response;
  const data = response?.data;
  if (response?.status === 429 && !(data && typeof data === "object" && "error" in data))
    return "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo.";

  if (data && typeof data === "object") {
    const { error, errors } = data as { error?: unknown; errors?: Record<string, unknown> };
    if (typeof error === "string" && ERROR_MESSAGES[error]) return ERROR_MESSAGES[error];
    if (errors && typeof errors === "object") return "Confira os dados informados.";
  }
  return fallback;
}
