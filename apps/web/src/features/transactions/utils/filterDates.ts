import type { TransactionsFilter, TxDatePreset } from "../types/filters.types";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildTxDateRange(filter: TransactionsFilter): { start: string; finish: string } {
  const today = new Date();

  switch (filter.preset) {
    case "current-month": {
      return { start: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)), finish: isoDate(today) };
    }
    case "last-3-months": {
      return { start: isoDate(new Date(today.getFullYear(), today.getMonth() - 2, 1)), finish: isoDate(today) };
    }
    case "last-6-months": {
      return { start: isoDate(new Date(today.getFullYear(), today.getMonth() - 5, 1)), finish: isoDate(today) };
    }
    case "last-12-months": {
      return { start: isoDate(new Date(today.getFullYear(), today.getMonth() - 11, 1)), finish: isoDate(today) };
    }
    case "current-year": {
      return { start: isoDate(new Date(today.getFullYear(), 0, 1)), finish: isoDate(today) };
    }
    case "custom-year": {
      const y = filter.customYear;
      const isCurrentYear = y === today.getFullYear();
      return {
        start: isoDate(new Date(y, 0, 1)),
        finish: isCurrentYear ? isoDate(today) : isoDate(new Date(y, 11, 31)),
      };
    }
    case "custom-range":
      return { start: filter.startDate, finish: filter.finishDate };
    default:
      return { start: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)), finish: isoDate(today) };
  }
}

export function defaultTxFilter(): TransactionsFilter {
  const today = new Date();
  return {
    preset: "current-month",
    customYear: today.getFullYear(),
    startDate: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    finishDate: isoDate(today),
    budgetIds: [],
    accountIds: [],
    categoryIds: [],
    subCategoryIds: [],
    typeFilter: "All",
    sortField: "date",
    sortOrder: "desc",
  };
}

export function activeTxDateLabel(filter: TransactionsFilter): string {
  const PRESET_LABELS: Record<TxDatePreset, string> = {
    "current-month":  "Mês atual",
    "last-3-months":  "3 meses",
    "last-6-months":  "6 meses",
    "last-12-months": "12 meses",
    "current-year":   "Este ano",
    "custom-year":    String(filter.customYear),
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
