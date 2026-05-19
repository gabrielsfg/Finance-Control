import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { TopCategoryItem } from "@/lib/types/dashboard.types";

const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: "#F5A623",
  Moradia: "#4A9EFF",
  Transporte: "#00C98D",
  Lazer: "#7C6FE0",
  Saúde: "#F25F5C",
  Educação: "#F5CE42",
  Investimentos: "#00D4A0",
};

export const TopCategoriesCard = ({ categories }: { categories: TopCategoryItem[] }) => {
  const max = Math.max(...categories.map((c) => c.totalSpent), 1);

  return (
    <div className="border-border bg-surface rounded-xl border p-4">
      <SectionHeader title="Gastos por Categoria" subtitle="Mês atual" />
      <div className="flex flex-col gap-3">
        {categories.slice(0, 5).map((cat) => {
          const color = CATEGORY_COLORS[cat.categoryName] ?? "#8A95A3";
          return (
            <div key={cat.categoryName}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: color }} />
                  <span className="text-text-sub text-[12px]">{cat.categoryName}</span>
                </div>
                <span className="font-money text-text text-[12px]">
                  {formatCurrency(cat.totalSpent / 100)}
                </span>
              </div>
              <ProgressBar value={cat.totalSpent} max={max} color={color} height={4} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
