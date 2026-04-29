import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/dashboard";
import { format, startOfMonth, endOfMonth } from "date-fns";
import type { DashboardSummary } from "@/lib/types/dashboard.types";

const MOCK_DATA: DashboardSummary = {
  balanceSummary: {
    totalIncome: 980000,
    totalExpenses: 482050,
    balance: 497950,
    incomeChange: 6.5,
    expenseChange: -4.2,
    balanceChange: 12.1,
  },
  recentTransactions: [
    { id: 1, description: "iFood", value: 8990, type: "Expense", subCategoryName: "Delivery", categoryName: "Alimentação" },
    { id: 2, description: "Salário", value: 980000, type: "Income", subCategoryName: "Salário", categoryName: "Receita" },
    { id: 3, description: "Mercado Extra", value: 31240, type: "Expense", subCategoryName: "Supermercado", categoryName: "Alimentação" },
    { id: 4, description: "Uber", value: 2350, type: "Expense", subCategoryName: "Aplicativo", categoryName: "Transporte" },
    { id: 5, description: "Aluguel", value: 220000, type: "Expense", subCategoryName: "Aluguel", categoryName: "Moradia" },
  ],
  budgetSummary: {
    totalExpected: 680000,
    totalSpent: 493320,
    spentPercentage: 72.5,
    hasAllocations: true,
    topSubCategories: [
      { subCategoryName: "Aluguel", categoryName: "Moradia", spent: 220000, allocated: 220000, spentPercentage: 100 },
      { subCategoryName: "Supermercado", categoryName: "Alimentação", spent: 31240, allocated: 50000, spentPercentage: 62.5 },
      { subCategoryName: "Delivery", categoryName: "Alimentação", spent: 8990, allocated: 20000, spentPercentage: 44.9 },
      { subCategoryName: "Combustível", categoryName: "Transporte", spent: 18000, allocated: 25000, spentPercentage: 72 },
    ],
  },
  topCategories: [
    { categoryName: "Alimentação", totalSpent: 60220 },
    { categoryName: "Moradia", totalSpent: 246510 },
    { categoryName: "Transporte", totalSpent: 48350 },
    { categoryName: "Lazer", totalSpent: 12480 },
    { categoryName: "Saúde", totalSpent: 16770 },
    { categoryName: "Educação", totalSpent: 8990 },
  ],
};

const USE_MOCK = true;

export const useDashboard = () => {
  const now = new Date();
  const startDate = format(startOfMonth(now), "yyyy-MM-dd");
  const finishDate = format(endOfMonth(now), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["dashboard", startDate, finishDate],
    queryFn: () =>
      USE_MOCK
        ? Promise.resolve(MOCK_DATA)
        : dashboardApi.getSummary({ startDate, finishDate }),
  });
};
