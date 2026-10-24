import type { BankConnectionStatus } from "@/lib/types/openFinance.types";

const ERROR_MESSAGES: Record<string, string> = {
  OPEN_FINANCE_UNAVAILABLE: "A conexão com bancos não está disponível no momento.",
  SUBSCRIPTION_REQUIRED: "Conectar bancos requer uma assinatura ativa.",
  CONNECTION_LIMIT_REACHED: "Seu plano já está com o máximo de bancos conectados. No Premium não há limite.",
  CONNECTION_NOT_FOUND: "Conexão não encontrada.",
  BANK_ACCOUNT_NOT_FOUND: "Conta do banco não encontrada.",
  ACCOUNT_NOT_FOUND: "Escolha uma conta válida para vincular.",
  ACCOUNT_ALREADY_LINKED: "Essa conta já recebe as transações de outra conta do banco.",
  ACCOUNT_TYPE_MISMATCH: "Cartão só pode ser vinculado a uma conta de cartão, e conta bancária a uma conta que não seja cartão.",
  BANK_ACCOUNT_ALREADY_LINKED: "Essa conta do banco já está vinculada.",
  RECONNECT_REQUIRED: "Reconecte o banco antes de sincronizar.",
  SYNC_COOLDOWN: "Você sincronizou há pouco. Tente novamente mais tarde.",
  NOTHING_TO_ADJUST: "O saldo já está igual ao do banco.",
  PROVIDER_UNAVAILABLE: "O serviço de Open Finance não respondeu. Tente novamente em alguns minutos.",
  PROVIDER_REJECTED: "O serviço de Open Finance recusou a operação. Tente novamente.",
};

/** The pt-BR message for a failed Open Finance request. */
export function openFinanceErrorMessage(err: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  const response = (err as { response?: { status?: number; data?: unknown } })?.response;
  const data = response?.data;
  if (data && typeof data === "object") {
    const { error, errors } = data as { error?: unknown; errors?: Record<string, unknown> };
    if (typeof error === "string" && ERROR_MESSAGES[error]) return ERROR_MESSAGES[error];
    if (errors && typeof errors === "object") return "Confira os dados informados.";
  }
  if (response?.status === 429) return "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo.";
  return fallback;
}

export const CONNECTION_STATUS: Record<BankConnectionStatus, { label: string; tone: "green" | "orange" | "red" | "muted" }> = {
  Syncing: { label: "Sincronizando", tone: "muted" },
  Active: { label: "Atualizado", tone: "green" },
  PartiallyUpdated: { label: "Atualizado em parte", tone: "orange" },
  Outdated: { label: "Banco instável", tone: "orange" },
  NeedsReconnect: { label: "Reconectar", tone: "red" },
  WaitingUser: { label: "Aguardando autorização", tone: "orange" },
  Disconnected: { label: "Desconectado", tone: "muted" },
};

export const TONE_CLASS: Record<"green" | "orange" | "red" | "muted", string> = {
  green: "bg-green/10 text-green border-green/25",
  orange: "bg-orange/10 text-orange border-orange/30",
  red: "bg-red/10 text-red border-red/30",
  muted: "bg-surface2 text-text-muted border-border",
};

/** "há 5 min", "há 3 h", "há 2 dias" — or null when never synced. */
export function formatSyncedAgo(iso: string | null): string | null {
  if (!iso) return null;
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return `há ${days} dia${days !== 1 ? "s" : ""}`;
}

/** First day of the current month, ISO — the default "import from" date. */
export function firstDayOfMonthIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}
