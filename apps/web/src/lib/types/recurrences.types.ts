export type RecurrenceType =
  | "Daily" | "WorkDay" | "Weekly" | "Biweekly"
  | "Monthly" | "Quarterly" | "Semiannually" | "Annually";

export type TransactionType = "Income" | "Expense";
export type PaymentMethod = "Debit" | "Credit";

export type RecurringItem = {
  id: number;
  subCategoryId: number;
  subCategoryName: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string | null;
  accountId: number;
  accountName: string;
  value: number;
  type: TransactionType;
  description: string;
  recurrence: RecurrenceType;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type InstallmentItem = {
  id: number;
  subCategoryId: number;
  subCategoryName: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string | null;
  accountId: number;
  accountName: string;
  value: number;
  totalValue: number;
  type: TransactionType;
  description: string;
  transactionDate: string;
  totalInstallments: number;
  paidInstallments: number;
  remainingInstallments: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod | null;
};

export type RecurrencePageData = {
  totalMonthlyAmount: number;
  subscriptionMonthlyAmount: number;
  installmentMonthlyAmount: number;
  activeRecurringCount: number;
  activeInstallmentCount: number;
  monthlyIncome: number;
  recurring: RecurringItem[];
  installments: InstallmentItem[];
};

export type CreateRecurringRequest = {
  subCategoryId: number;
  accountId: number;
  value: number;
  type: TransactionType;
  description: string;
  recurrence: RecurrenceType;
  startDate: string;
  endDate?: string;
  includeInBudget: boolean;
};

export type UpdateRecurringRequest = {
  subCategoryId?: number;
  accountId?: number;
  value?: number;
  description?: string;
  endDate?: string;
};

export type RecurrenceFilter = {
  month: number;
  year: number;
  categoryIds: number[];
  subCategoryIds: number[];
  accountIds: number[];
  typeFilter: "All" | "Recurring" | "Installment";
};

export function defaultRecurrenceFilter(): RecurrenceFilter {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    categoryIds: [],
    subCategoryIds: [],
    accountIds: [],
    typeFilter: "All",
  };
}
