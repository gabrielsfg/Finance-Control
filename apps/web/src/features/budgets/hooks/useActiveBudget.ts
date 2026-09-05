import { useMemo } from "react";
import { useBudgets } from "./useBudgets";
import type { Budget } from "@/lib/types/budgets.types";

export type ActiveBudgetPeriod = {
  budget: Budget;
  startDate: string;
  endDate: string;
};

/**
 * Returns the active budget and its current period dates (ISO `YYYY-MM-DD`).
 *
 * The dates come straight from the API, which already answers with the cycle containing
 * today. Re-deriving them here meant two implementations of the same rule that could —
 * and did — disagree: the client added one recurrence to the period start it was handed,
 * so any correction on the server had to be mirrored by hand.
 *
 * `endDate` is EXCLUSIVE: a transaction dated on it belongs to the next cycle, which
 * starts that day.
 */
export function useActiveBudget(): { data: ActiveBudgetPeriod | null; isLoading: boolean } {
  const { data: budgets, isLoading } = useBudgets();

  const data = useMemo(() => {
    const budget = budgets?.find((b) => b.isActive);
    if (!budget) return null;
    return { budget, startDate: budget.startDate, endDate: budget.endDate };
  }, [budgets]);

  return { data, isLoading };
}
