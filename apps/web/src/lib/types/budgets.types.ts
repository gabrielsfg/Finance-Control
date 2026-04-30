export type BudgetRecurrence = "Monthly" | "Weekly" | "Biweekly" | "Quarterly";

export type BudgetAllocation = {
  id: number;
  subCategoryId: number;
  subCategoryName: string;
  categoryName: string;
  categoryColor: string | null;
  areaName: string;
  areaColor: string | null;
  allocated: number;
  spent: number;
  spentPercentage: number;
};

export type Budget = {
  id: number;
  name: string;
  recurrence: BudgetRecurrence;
  startDate: string;
  endDate: string;
  totalAllocated: number;
  totalSpent: number;
  spentPercentage: number;
  allocations: BudgetAllocation[];
};
