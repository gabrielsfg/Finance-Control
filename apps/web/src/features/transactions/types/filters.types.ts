import type { PeriodPreset } from "@/lib/utils/periodPresets";

/**
 * The shared presets plus `custom-year`, which only this page offers. Everything else
 * resolves through `buildPeriodRange`, so "últimos 6 meses" cannot come to mean one thing
 * here and another on the overview.
 *
 * The default is `budget-cycle`: a budget that runs the 5th to the 5th makes "September"
 * the wrong window to open on — it hides five days the user is still spending against and
 * shows twenty-five they are not.
 */
export type TxDatePreset = PeriodPreset | "custom-year";

export type TxSortField = "date" | "value";
export type TxSortOrder = "desc" | "asc";

export type TransactionsFilter = {
  preset: TxDatePreset;
  customYear: number;
  startDate: string;
  finishDate: string;
  tagIds: number[];
  budgetIds: number[];
  accountIds: number[];
  categoryIds: number[];
  subCategoryIds: number[];
  typeFilter: "All" | "Income" | "Expense" | "Transfer";
  /** Inclusive bounds on the transaction magnitude, in cents. Null means open-ended. */
  minValue: number | null;
  maxValue: number | null;
  sortField: TxSortField;
  sortOrder: TxSortOrder;
};
