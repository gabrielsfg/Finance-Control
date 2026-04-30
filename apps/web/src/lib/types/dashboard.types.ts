export type BalanceSummary = {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  incomeChange?: number;
  expenseChange?: number;
  balanceChange?: number;
};

export type RecentTransaction = {
  id: number;
  description: string;
  value: number;
  type: "Income" | "Expense" | "Transfer";
  subCategoryName: string;
  categoryName: string;
};

export type BudgetSubCategorySummary = {
  subCategoryName: string;
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

export type DashboardSummary = {
  balanceSummary: BalanceSummary;
  recentTransactions: RecentTransaction[];
  budgetSummary: BudgetSummary | null;
  topCategories: TopCategoryItem[];
};
