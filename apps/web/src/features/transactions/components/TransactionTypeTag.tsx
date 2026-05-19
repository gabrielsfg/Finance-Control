import { cn } from "@/lib/utils";
import type { PaymentType, TransactionType } from "@/lib/types/transactions.types";
import { RefreshCw, Layers } from "lucide-react";

type TypeTagProps = { type: TransactionType };

export const TransactionTypeTag = ({ type }: TypeTagProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
      type === "Income"
        ? "bg-green/12 text-green"
        : "bg-red/12 text-red",
    )}
  >
    {type === "Income" ? "Receita" : "Despesa"}
  </span>
);

type PaymentTagProps = {
  paymentType: PaymentType;
  installmentNumber?: number | null;
  totalInstallments?: number | null;
};

export const PaymentTag = ({ paymentType, installmentNumber, totalInstallments }: PaymentTagProps) => {
  if (paymentType === "Recurring") {
    return (
      <span className="text-text-muted flex items-center gap-1 text-[12px]">
        <RefreshCw size={11} />
        Recorrente
      </span>
    );
  }
  if (paymentType === "Installment" && installmentNumber && totalInstallments) {
    return (
      <span className="text-text-muted flex items-center gap-1 text-[12px]">
        <Layers size={11} />
        {installmentNumber}/{totalInstallments}x
      </span>
    );
  }
  return null;
};
