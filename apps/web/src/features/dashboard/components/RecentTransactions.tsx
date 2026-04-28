import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import type { RecentTransaction } from "@/lib/types/dashboard.types";

const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: "#F5A623",
  Moradia: "#4A9EFF",
  Transporte: "#00C98D",
  Lazer: "#7C6FE0",
  Saúde: "#F25F5C",
  Educação: "#F5CE42",
  Investimentos: "#00D4A0",
  Receita: "#00C98D",
  Transferência: "#8A95A3",
};

export const RecentTransactions = ({ transactions }: { transactions: RecentTransaction[] }) => {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <SectionHeader
        title="Transações Recentes"
        action={() => router.push("/transactions")}
        actionLabel="Ver todas"
      />
      <div className="flex flex-col">
        {transactions.map((tx, i) => {
          const color = CATEGORY_COLORS[tx.categoryName] ?? "#8A95A3";
          const isIncome = tx.type === "Income";
          const isTransfer = tx.type === "Transfer";

          return (
            <div
              key={tx.id}
              className={cn(
                "flex items-center gap-3 py-2.5",
                i < transactions.length - 1 && "border-b border-border",
              )}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[14px]"
                style={{ backgroundColor: `${color}22` }}
              >
                💸
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-500 text-text">{tx.description}</p>
                <p className="mt-0.5 text-[11px] text-text-muted">{tx.categoryName}</p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "font-money text-[13px] font-500",
                    isIncome ? "text-green" : isTransfer ? "text-text-sub" : "text-red",
                  )}
                >
                  {isIncome ? "+" : isTransfer ? "" : "-"}
                  {formatCurrency(Math.abs(tx.value / 100))}
                </p>
                <p className="mt-0.5 text-[10px] text-text-muted">{tx.subCategoryName}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
