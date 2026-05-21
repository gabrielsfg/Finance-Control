import { useMemo } from "react";
import { useBudgets } from "./useBudgets";
import { computeActivePeriod } from "@/lib/utils/budgetPeriod";
import type { Budget } from "@/lib/types/budgets.types";

export type ActiveBudgetPeriod = {
  budget: Budget;
  startDate: string;
  endDate: string;
};

/**
 * Returns the active budget and its current period dates.
 * startDate and endDate are ISO strings (YYYY-MM-DD).
 */
export function useActiveBudget(): { data: ActiveBudgetPeriod | null; isLoading: boolean } {
  const { data: budgets, isLoading } = useBudgets();

  const data = useMemo(() => {
    const budget = budgets?.find((b) => b.isActive);
    if (!budget) return null;
    const period = computeActivePeriod(budget.startDate, budget.recurrence);
    return { budget, startDate: period.startDate, endDate: period.endDate };
  }, [budgets]);

  return { data, isLoading };
}
