import type { TransactionType, PaymentType } from "./transactions.types";

/** Where the suggested subcategory came from: the user's own past imports, the AI, or nowhere. */
export type CategorizationSource = "None" | "History" | "Ai";

export type ParsedTransactionItem = {
  externalId: string;
  date: string;
  description: string;
  value: number;
  type: TransactionType;
  /** Whether the statement line credited the account — the direction a transfer goes. */
  isInflow: boolean;
  suggestedSubCategoryId: number | null;
  suggestedSubCategoryName: string | null;
  paymentType: PaymentType;
  totalInstallments: number | null;
  installmentNumber: number | null;
  isDuplicate: boolean;
  duplicateReason: string | null;
  categorizationSource: CategorizationSource;
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
  /** Ignored for transfers — the server files them under the system transfer subcategory. */
  subCategoryId: number | null;
  /** Transfers only: the other account. Source when `isInflow`, destination otherwise. */
  counterpartAccountId: number | null;
  isInflow: boolean;
  paymentType: PaymentType;
  totalInstallments: number | null;
  installmentNumber: number | null;
  /** Tag names, as typed on the review screen — the server resolves or creates them. */
  tags: string[];
};

export type ImportTransactionsRequest = {
  accountId: number;
  countForBudget: boolean;
  transactions: ImportTransactionItem[];
};
