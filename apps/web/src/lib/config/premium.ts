import type { SubscriptionPlan } from "@/lib/types/subscription.types";

/** Where every "assinar" / upgrade CTA points. */
export const PREMIUM_UPGRADE_HREF: string | null = "/plans";

/**
 * What each plan includes, for the plans page and the upsell copy. Keep it to what the
 * API actually gates: today Premium differs from Basic only by the in-app AI features
 * (AiAccessPolicy checks the Premium plan), everything else is in both.
 */
export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  Basic: [
    "Contas, cartões e transações ilimitadas",
    "Orçamentos, metas e recorrências",
    "Investimentos, análises e simulações",
    "Importação de extratos",
    "Conexão com Claude, ChatGPT e outras IAs",
  ],
  Premium: [
    "Tudo do Basic",
    "Assistente de IA dentro do app",
    "Análises semanais de gastos com IA",
    "Leitura da carteira de investimentos com IA",
  ],
};

/** What the Premium plan adds, for the locked cards. */
export const PREMIUM_FEATURES = PLAN_FEATURES.Premium.slice(1);
