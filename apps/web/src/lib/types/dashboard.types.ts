export type BalanceSummary = {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  netWorth: number;
  incomeChange?: number;
  expenseChange?: number;
  balanceChange?: number;
  netWorthChange?: number;
  previousIncome?: number;
  previousExpenses?: number;
  previousBalance?: number;
  previousNetWorth?: number;
};

export type RecentTransaction = {
  id: number;
  description: string;
  value: number;
  type: "Income" | "Expense" | "Transfer";
  subCategoryName: string;
  subCategoryEmoji?: string | null;
  categoryName: string;
  isRecurring?: boolean;
  isAutomatic?: boolean;
};

export type BudgetSubCategorySummary = {
  subCategoryName: string;
  subCategoryEmoji?: string | null;
  categoryName: string;
  categoryColor: string | null;
  spent: number;
  allocated: number;
  spentPercentage: number;
};

export type BudgetSummary = {
  totalExpected: number;
  totalSpent: number;
  spentPercentage: number;
  hasAllocations: boolean;
  topSubCategories: BudgetSubCategorySummary[];
};

export type TopCategoryItem = {
  categoryName: string;
  color: string | null;
  totalSpent: number;
};

export type SpendingPredictionItem = {
  day: number;
  currentExpense: number | null;
  historicalAverage: number;
};

export type DashboardSummary = {
  balanceSummary: BalanceSummary;
  recentTransactions: RecentTransaction[];
  budgetSummary: BudgetSummary | null;
  topCategories: TopCategoryItem[];
  spendingPrediction: SpendingPredictionItem[];
};
