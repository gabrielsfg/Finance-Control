export type BudgetRecurrence = "Monthly" | "Weekly" | "Biweekly" | "Semiannually" | "Annually";

export type AllocationType = "Expense" | "Income";

export type CreateAllocationInBudgetRequest = {
  subCategoryId: number;
  expectedValue: number;
  allocationType: AllocationType;
};

export type CreateAreaInBudgetRequest = {
  name: string;
  allocations: CreateAllocationInBudgetRequest[];
};

export type CreateBudgetRequest = {
  name: string;
  startDate: number;
  recurrence: BudgetRecurrence;
  isActive: boolean;
  areas: CreateAreaInBudgetRequest[];
};

export type BudgetAllocation = {
  id: number;
  subCategoryId: number;
  subCategoryName: string;
  subCategoryEmoji?: string | null;
  categoryName: string;
  categoryColor: string | null;
  areaName: string;
  allocated: number;
  spent: number;
  spentPercentage: number;
  allocationType: AllocationType;
};

export type UpdateBudgetRequest = {
  name: string;
  startDate: number;
  recurrence: BudgetRecurrence;
  isActive: boolean;
  areas: CreateAreaInBudgetRequest[];
};

export type Budget = {
  id: number;
  name: string;
  recurrence: BudgetRecurrence;
  isActive: boolean;
  startDate: string;
  endDate: string;
  totalAllocated: number;
  totalSpent: number;
  spentPercentage: number;
  allocations: BudgetAllocation[];
};
