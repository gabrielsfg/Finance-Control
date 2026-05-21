import { Landmark, PiggyBank, CreditCard, Wallet, Banknote } from "lucide-react";
import type { AccountType } from "@/lib/types/accounts.types";

export const ACCOUNT_TYPE_CONFIG: Record<AccountType, { label: string; color: string; Icon: React.ElementType }> = {
  Checking: { label: "Conta Corrente",    color: "#4A9EFF", Icon: Landmark  },
  Savings:  { label: "Poupança",          color: "#00C98D", Icon: PiggyBank },
  Credit:   { label: "Cartão de Crédito", color: "#7C6FE0", Icon: CreditCard },
  Cash:     { label: "Dinheiro",          color: "#F5CE42", Icon: Banknote  },
};
