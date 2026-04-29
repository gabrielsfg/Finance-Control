import { Pencil, Trash2, Star, CreditCard, Landmark, PiggyBank, Wallet, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { AccountItem, AccountType } from "@/lib/types/accounts.types";

const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  { label: string; color: string; Icon: React.ElementType }
> = {
  Checking: { label: "Conta Corrente", color: "#4A9EFF", Icon: Landmark },
  Savings: { label: "Poupança", color: "#00C98D", Icon: PiggyBank },
  Credit: { label: "Cartão de Crédito", color: "#7C6FE0", Icon: CreditCard },
  Debit: { label: "Débito", color: "#F5A623", Icon: Wallet },
  Cash: { label: "Dinheiro", color: "#F5CE42", Icon: Banknote },
};

type AccountCardProps = {
  account: AccountItem;
  onEdit: (account: AccountItem) => void;
  onDelete: (account: AccountItem) => void;
};

export const AccountCard = ({ account, onEdit, onDelete }: AccountCardProps) => {
  const config = ACCOUNT_TYPE_CONFIG[account.type];
  const { Icon, color, label } = config;
  const isNegative = account.currentAmount < 0;

  return (
    <div className="border-border bg-surface group relative flex flex-col gap-4 rounded-xl border p-5 transition-shadow hover:shadow-sm">
      {account.isDefaultAccount && (
        <div className="absolute top-3 right-3">
          <Star size={13} className="fill-yellow text-yellow" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: `${color}1a` }}
        >
          <Icon size={18} strokeWidth={1.75} style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="font-500 text-text truncate text-[15px]">{account.name}</p>
          <p className="text-text-muted text-[13px]">{label}</p>
        </div>
      </div>

      <div>
        <p className="text-text-muted mb-0.5 text-[12px] tracking-[0.04em] uppercase">Saldo atual</p>
        <p
          className={cn(
            "font-money font-600 text-[22px] tracking-tight",
            isNegative ? "text-red" : "text-text",
          )}
        >
          {isNegative ? "-" : ""}
          {formatCurrency(Math.abs(account.currentAmount / 100))}
        </p>
      </div>

      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onEdit(account)}
          className="border-border text-text-sub hover:bg-surface2 hover:text-text flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[13px] transition-colors"
        >
          <Pencil size={12} />
          Editar
        </button>
        <button
          onClick={() => onDelete(account)}
          className="border-border text-text-sub hover:bg-red/10 hover:text-red flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[13px] transition-colors"
        >
          <Trash2 size={12} />
          Excluir
        </button>
      </div>
    </div>
  );
};
