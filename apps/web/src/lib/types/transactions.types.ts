export type TransactionType = "Income" | "Expense";
export type PaymentType = "OneTime" | "Installment" | "Recurring";
export type PaymentMethod = "Debit" | "Credit";
export type RecurrenceType =
  | "Daily"
  | "WorkDay"
  | "Weekly"
  | "Biweekly"
  | "Monthly"
  | "Quarterly"
  | "Semiannually"
  | "Annually";

export type TransactionItem = {
  id: number;
  budgetId: number | null;
  subCategoryId: number;
  subCategoryName: string;
  accountId: number;
  accountName: string;
  recurringTransactionId: number | null;
  parentTransactionId: number | null;
  value: number;
  type: TransactionType;
  description: string;
  transactionDate: string;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
};

export type SubCategoryItem = {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryColor: string | null;
  name: string;
};

export type CreateTransactionRequest = {
  includeInBudget: boolean;
  subCategoryId: number;
  accountId: number;
  value: number;
  type: TransactionType;
  description: string;
  transactionDate: string;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod | null;
  totalInstallments: number | null;
  recurrence: RecurrenceType | null;
};

export type UpdateTransactionRequest = {
  budgetId: number | null;
  subCategoryId: number;
  accountId: number;
  value: number;
  description: string;
  transactionDate: string;
  paymentMethod: PaymentMethod | null;
};
