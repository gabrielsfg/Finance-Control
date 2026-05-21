import type { TransactionType, PaymentType } from "./transactions.types";

export type ParsedTransactionItem = {
  externalId: string;
  date: string;
  description: string;
  value: number;
  type: TransactionType;
  suggestedSubCategoryId: number | null;
  suggestedSubCategoryName: string | null;
  paymentType: PaymentType;
  totalInstallments: number | null;
  installmentNumber: number | null;
  isDuplicate: boolean;
  duplicateReason: string | null;
};

export type ParseImportFileResponse = {
  transactions: ParsedTransactionItem[];
  totalFound: number;
  duplicatesFound: number;
};

export type ImportTransactionItem = {
  date: string;
  description: string;
  value: number;
  type: TransactionType;
  subCategoryId: number | null;
  destinationAccountId: number | null;
  paymentType: PaymentType;
  totalInstallments: number | null;
  installmentNumber: number | null;
};

export type ImportTransactionsRequest = {
  accountId: number;
  countForBudget: boolean;
  transactions: ImportTransactionItem[];
};
