export type TxDatePreset =
  | "current-month"
  | "last-3-months"
  | "last-6-months"
  | "last-12-months"
  | "current-year"
  | "custom-year"
  | "custom-range";

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
