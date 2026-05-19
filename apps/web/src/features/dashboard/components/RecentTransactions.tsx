import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
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

export const RecentTransactions = ({
  transactions,
  className,
}: {
  transactions: RecentTransaction[];
  className?: string;
}) => {
  const router = useRouter();

  return (
    <div className={cn("border-border bg-surface rounded-xl border p-5", className)}>
      <SectionHeader
        title="Transações Recentes"
        action={() => router.push("/transactions")}
        actionLabel="Ver todas"
      />
      {transactions.length === 0 ? (
        <ChartEmptyState message="Nenhuma transação registrada este mês" />
      ) : (
        <div className="flex flex-col">
          {transactions.map((tx, i) => {
            const color = CATEGORY_COLORS[tx.categoryName] ?? "#8A95A3";
            const isIncome = tx.type === "Income";
            const isTransfer = tx.type === "Transfer";

            return (
              <div
                key={tx.id}
                className={cn(
                  "flex items-center gap-3 py-3",
                  i < transactions.length - 1 && "border-border border-b",
                )}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[14px]"
                  style={{ backgroundColor: `${color}22` }}
                >
                  {tx.subCategoryEmoji ?? "💸"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-500 text-text truncate text-[14px]">{tx.description}</p>
                    {tx.isRecurring && (
                      <span className="text-purple border-purple/30 bg-purple/10 shrink-0 rounded-full border px-1.5 py-px text-[10px] font-medium">
                        Recorrente
                      </span>
                    )}
                    {tx.isAutomatic && (
                      <span className="text-blue border-blue/30 bg-blue/10 shrink-0 rounded-full border px-1.5 py-px text-[10px] font-medium">
                        Auto
                      </span>
                    )}
                  </div>
                  <p className="text-text-muted mt-0.5 text-[12px]">{tx.categoryName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "font-money font-500 text-[14px]",
                      isIncome ? "text-green" : isTransfer ? "text-text-sub" : "text-text",
                    )}
                  >
                    {isIncome ? "+" : isTransfer ? "" : "-"}
                    {formatCurrency(Math.abs(tx.value / 100))}
                  </p>
                  <p className="text-text-muted mt-0.5 text-[11px]">{tx.subCategoryEmoji ? `${tx.subCategoryEmoji} ${tx.subCategoryName}` : tx.subCategoryName}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
