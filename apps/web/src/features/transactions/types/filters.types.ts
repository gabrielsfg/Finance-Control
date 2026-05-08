export type TxDatePreset =
  | "current-month"
  | "last-3-months"
  | "last-6-months"
  | "last-12-months"
  | "current-year"
  | "custom-year"
  | "custom-range";

export type TransactionsFilter = {
  preset: TxDatePreset;
  customYear: number;
  startDate: string;
  finishDate: string;
  budgetIds: number[];
  accountIds: number[];
  categoryIds: number[];
  subCategoryIds: number[];
  typeFilter: "All" | "Income" | "Expense" | "Transfer";
};
