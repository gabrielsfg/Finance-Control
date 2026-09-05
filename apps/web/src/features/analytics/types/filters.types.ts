export type DatePreset =
  /**
   * The active budget's current cycle. Offered but NOT the default here: these pages are
   * trend views, and a single cycle collapses a monthly evolution chart to one point.
   */
  | "budget-cycle"
  | "current-month"
  | "last-3-months"
  | "last-6-months"
  | "last-12-months"
  | "current-year"
  | "custom-year"
  | "custom-range";

export type TransactionTypeFilter = "all" | "expense" | "income" | "recurring" | "installment";

// Investment asset class filter (mirrors backend InvestmentLaunch.assetClass strings)
export type AssetClassFilter =
  | "all"
  | "Renda Fixa"
  | "Renda Variável"
  | "FII"
  | "Internacional"
  | "Cripto"
  | "Tesouro Direto";

export type AnalyticsFilter = {
  preset: DatePreset;
  // For custom-year: the selected year
  customYear: number;
  // For custom-range or current-month: explicit start/finish ISO dates
  startDate: string;
  finishDate: string;
  // Expense-tab filters (empty array = all)
  tagIds: number[];
  categoryIds: number[];
  accountIds: number[];
  transactionType: TransactionTypeFilter;
  // Investment-tab filter
  assetClass: AssetClassFilter;
};
