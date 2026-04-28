export type BalanceSummary = {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
};

export type RecentTransaction = {
  id: number;
  description: string;
  value: number;
  type: "Income" | "Expense" | "Transfer";
  subCategoryName: string;
  categoryName: string;
};

export type BudgetSummary = {
  totalExpected: number;
  totalSpent: number;
  spentPercentage: number;
};

export type TopCategoryItem = {
  categoryName: string;
  totalSpent: number;
};

export type DashboardSummary = {
  balanceSummary: BalanceSummary;
  recentTransactions: RecentTransaction[];
  budgetSummary: BudgetSummary;
  topCategories: TopCategoryItem[];
};
