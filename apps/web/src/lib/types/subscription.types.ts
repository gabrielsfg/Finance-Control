export type SubscriptionPlan = "Basic" | "Premium";
export type BillingCycle = "Monthly" | "Yearly";
export type BillingMethod = "CreditCard" | "Pix" | "Boleto";
export type SubscriptionStatus = "Trialing" | "PendingPayment" | "Active" | "Canceled" | "Expired";
export type SubscriptionEndReason = "Canceled" | "PaymentFailed" | "Refunded" | "Chargeback";
export type ChargeStatus = "Creating" | "Pending" | "Confirmed" | "Failed" | "Refunded" | "Canceled";

export type SubscriptionPlanOption = {
  plan: SubscriptionPlan;
  name: string;
  cycle: BillingCycle;
  /** Cents per cycle. */
  price: number;
  /** Cents per month (yearly price / 12). */
  monthlyEquivalent: number;
  maxInstallments: number;
};

export type SubscriptionPlans = {
  trialDays: number;
  isTrialEligible: boolean;
  options: SubscriptionPlanOption[];
};

export type SubscriptionCharge = {
  id: number;
  plan: SubscriptionPlan;
  cycle: BillingCycle;
  billingMethod: BillingMethod;
  /** Cents, all installments together. */
  amount: number;
  installmentCount: number;
  status: ChargeStatus;
  /** YYYY-MM-DD */
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  confirmedAt: string | null;
  refundedAt: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
};

export type SubscriptionPendingChange = {
  plan: SubscriptionPlan;
  cycle: BillingCycle;
  installmentCount: number;
  price: number;
  effectiveAt: string;
};

export type SubscriptionState = {
  hasAccess: boolean;
  status: SubscriptionStatus | null;
  endReason: SubscriptionEndReason | null;
  plan: SubscriptionPlan | null;
  cycle: BillingCycle | null;
  billingMethod: BillingMethod | null;
  installmentCount: number;
  price: number | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  endedAt: string | null;
  isComplimentary: boolean;
  cardBrand: string | null;
  cardLast4: string | null;
  pendingChange: SubscriptionPendingChange | null;
  pendingCharge: SubscriptionCharge | null;
  showRenewalReminder: boolean;
  canRequestRefund: boolean;
  canResume: boolean;
  charges: SubscriptionCharge[];
};

export type SubscriptionCard = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
};

export type CreateSubscriptionRequest = {
  plan: SubscriptionPlan;
  cycle: BillingCycle;
  billingMethod: BillingMethod;
  installmentCount: number;
  cpf: string;
  mobilePhone: string;
  postalCode: string;
  addressNumber: string;
  card?: SubscriptionCard;
  captchaToken?: string;
};

export type UpdateSubscriptionCardRequest = {
  cpf: string;
  mobilePhone: string;
  postalCode: string;
  addressNumber: string;
  card: SubscriptionCard;
  captchaToken?: string;
};

export type ChangeSubscriptionPlanRequest = {
  plan: SubscriptionPlan;
  cycle: BillingCycle;
  installmentCount: number;
  confirm: boolean;
};

export type ChangeSubscriptionPlanResponse = {
  plan: SubscriptionPlan;
  cycle: BillingCycle;
  installmentCount: number;
  price: number;
  nextChargeAt: string;
  planAppliesNow: boolean;
  applied: boolean;
  subscription: SubscriptionState | null;
};

export type SubscriptionPixQrCode = {
  payload: string;
  qrImageBase64: string;
  expiresAt: string | null;
  amount: number;
  dueDate: string;
};
