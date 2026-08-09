export type TransactionType = "Income" | "Expense" | "Transfer";
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

export type TagItem = {
  id: number;
  name: string;
};

export type TransactionItem = {
  id: number;
  budgetId: number | null;
  budgetName: string | null;
  subCategoryId: number;
  subCategoryName: string;
  subCategoryEmoji: string | null;
  /** Parent category of the subcategory — carried so a row can be read on its own. */
  categoryName: string;
  accountId: number;
  accountName: string;
  destinationAccountId: number | null;
  destinationAccountName: string | null;
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
  tags: TagItem[];
};

export type SubCategoryItem = {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryColor: string | null;
  name: string;
  emoji: string | null;
};

export type CreateTransactionRequest = {
  includeInBudget: boolean;
  subCategoryId?: number;
  accountId: number;
  destinationAccountId?: number | null;
  value: number;
  type: TransactionType;
  description: string;
  transactionDate: string;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod | null;
  totalInstallments: number | null;
  recurrence: RecurrenceType | null;
  tags: string[];
};

export type UpdateTransactionRequest = {
  subCategoryId?: number;
  accountId: number;
  destinationAccountId?: number | null;
  value: number;
  type: TransactionType;
  description: string;
  transactionDate: string;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod | null;
  totalInstallments: number | null;
  recurrence: RecurrenceType | null;
  includeInBudget: boolean;
  tags: string[];
};

export type TxSortField = "date" | "value";
export type TxSortOrder = "desc" | "asc";

export type GetTransactionsFilterParams = {
  startDate: string;
  finishDate: string;
  budgetIds?: number[];
  accountIds?: number[];
  categoryIds?: number[];
  subCategoryIds?: number[];
  tagIds?: number[];
  type?: TransactionType;
  /** Inclusive bounds on the transaction magnitude, in cents. */
  minValue?: number;
  maxValue?: number;
  /** Matched against description, tag, subcategory and account name. */
  search?: string;
  page?: number;
  pageSize?: number;
  sortField?: TxSortField;
  sortOrder?: TxSortOrder;
};

export type TransactionsFilteredResponse = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  previousTotalIncome?: number;
  previousTotalExpense?: number;
  previousBalance?: number;
  page: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    rowCount: number;
    items: TransactionItem[];
  };
};
