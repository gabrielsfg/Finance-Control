import type { TransactionsFilter, TxDatePreset } from "../types/filters.types";
import { buildPeriodRange, isoDate, type BudgetCycle } from "@/lib/utils/periodPresets";

export type { BudgetCycle };

export function buildTxDateRange(
  filter: TransactionsFilter,
  cycle?: BudgetCycle | null,
): { start: string; finish: string } {
  // The two presets this page owns; everything else is the shared definition.
  if (filter.preset === "all-time") {
    // Far enough back to predate any ledger somebody imports, so nothing is
    // unreachable from the UI without hand-typing a range.
    return { start: "1900-01-01", finish: isoDate(new Date()) };
  }

  if (filter.preset === "custom-year") {
    const today = new Date();
    const y = filter.customYear;
    return {
      start: isoDate(new Date(y, 0, 1)),
      finish: y === today.getFullYear() ? isoDate(today) : isoDate(new Date(y, 11, 31)),
    };
  }

  return buildPeriodRange(
    { preset: filter.preset, startDate: filter.startDate, finishDate: filter.finishDate },
    cycle,
  );
}

export function defaultTxFilter(): TransactionsFilter {
  const today = new Date();
  return {
    preset: "budget-cycle",
    customYear: today.getFullYear(),
    startDate: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    finishDate: isoDate(today),
    tagIds: [],
    budgetIds: [],
    budgetInclusion: "all",
    accountIds: [],
    categoryIds: [],
    subCategoryIds: [],
    typeFilter: "All",
    minValue: null,
    maxValue: null,
    sortField: "date",
    sortOrder: "desc",
  };
}

export function activeTxDateLabel(filter: TransactionsFilter): string {
  const PRESET_LABELS: Record<TxDatePreset, string> = {
    "budget-cycle":   "Ciclo do orçamento",
    "current-month":  "Mês atual",
    "last-3-months":  "3 meses",
    "last-6-months":  "6 meses",
    "last-12-months": "12 meses",
    "current-year":   "Este ano",
    "custom-year":    String(filter.customYear),
    "all-time":       "Todo o período",
    "custom-range":   `${filter.startDate} → ${filter.finishDate}`,
  };
  return PRESET_LABELS[filter.preset];
}

export function availableTxYears(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= current - 5; y--) years.push(y);
  return years;
}
