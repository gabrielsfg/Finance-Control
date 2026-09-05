import type { AnalyticsFilter, DatePreset } from "../types/filters.types";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * The active budget's cycle, as `useActiveBudget` reports it: `endDate` is EXCLUSIVE,
 * because a transaction dated on it belongs to the next cycle, which starts that day.
 */
export type BudgetCycle = { startDate: string; endDate: string };

function toInclusiveEnd(exclusiveEndIso: string): string {
  const d = new Date(exclusiveEndIso + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return isoDate(d);
}

export function buildDateRange(
  filter: AnalyticsFilter,
  cycle?: BudgetCycle | null,
): { start: string; finish: string } {
  const today = new Date();

  switch (filter.preset) {
    case "budget-cycle": {
      // No active budget, or budgets not loaded yet: fall back to the calendar month.
      if (!cycle) {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: isoDate(start), finish: isoDate(today) };
      }
      return { start: cycle.startDate, finish: toInclusiveEnd(cycle.endDate) };
    }
    case "current-month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: isoDate(start), finish: isoDate(today) };
    }
    case "last-3-months": {
      const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      return { start: isoDate(start), finish: isoDate(today) };
    }
    case "last-6-months": {
      const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      return { start: isoDate(start), finish: isoDate(today) };
    }
    case "last-12-months": {
      const start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
      return { start: isoDate(start), finish: isoDate(today) };
    }
    case "current-year": {
      const start = new Date(today.getFullYear(), 0, 1);
      return { start: isoDate(start), finish: isoDate(today) };
    }
    case "custom-year": {
      const y = filter.customYear;
      const isCurrentYear = y === today.getFullYear();
      const start = isoDate(new Date(y, 0, 1));
      const finish = isCurrentYear ? isoDate(today) : isoDate(new Date(y, 11, 31));
      return { start, finish };
    }
    case "custom-range":
      return { start: filter.startDate, finish: filter.finishDate };
    default:
      return { start: isoDate(new Date(today.getFullYear(), today.getMonth() - 5, 1)), finish: isoDate(today) };
  }
}

export function defaultFilter(): AnalyticsFilter {
  const today = new Date();
  return {
    preset: "last-6-months",
    customYear: today.getFullYear(),
    startDate: isoDate(new Date(today.getFullYear(), today.getMonth() - 5, 1)),
    finishDate: isoDate(today),
    tagIds: [],
    categoryIds: [],
    accountIds: [],
    transactionType: "all",
    assetClass: "all",
  };
}

export function presetLabel(preset: DatePreset, customYear?: number): string {
  switch (preset) {
    case "budget-cycle":    return "Ciclo do orçamento";
    case "current-month":   return "Mês atual";
    case "last-3-months":   return "3 meses";
    case "last-6-months":   return "6 meses";
    case "last-12-months":  return "12 meses";
    case "current-year":    return "Este ano";
    case "custom-year":     return String(customYear ?? new Date().getFullYear());
    case "custom-range":    return "Personalizado";
  }
}

export function availableYears(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= current - 5; y--) years.push(y);
  return years;
}
