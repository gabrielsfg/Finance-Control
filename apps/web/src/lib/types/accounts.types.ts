import type { BankConnectionStatus } from "@/lib/types/openFinance.types";

export type AccountType = "Checking" | "Savings" | "Credit" | "Cash";

export type AccountItem = {
  id: number;
  name: string;
  type: AccountType;
  currentAmount: number;
  isDefaultAccount: boolean;
  creditLimit?: number | null;
  billingDueDay?: number | null;
  billingClosingDay?: number | null;
  /** Bank slug from `lib/config/banks`; null shows the account-type icon. */
  bankSlug?: string | null;
  /** A card with closing and due days: its balance split into bills. */
  bills?: CreditCardBills | null;
  /** Imports from a bank through Open Finance. */
  isConnected?: boolean;
  bankConnectionId?: number | null;
  connectorName?: string | null;
  connectorImageUrl?: string | null;
  connectionStatus?: BankConnectionStatus | null;
  lastSyncedAt?: string | null;
  /** Cents, as the bank reports it (a card: the used limit). */
  externalBalance?: number | null;
};

export type CreditCardBill = {
  closingDate: string;
  dueDate: string;
  /** Cents owed on this bill (positive). */
  amount: number;
};

export type CreditCardBills = {
  /** Closed and not fully paid yet. */
  closedBill: CreditCardBill | null;
  /** The open bill. */
  currentBill: CreditCardBill;
  /** Later bills with installments already scheduled. */
  upcomingBills: CreditCardBill[];
};

export type AccountDetail = {
  id: number;
  name: string;
  type: AccountType;
  currentAmount: number;
  goalAmount: number | null;
  isDefaultAccount: boolean;
  billingDueDay: number | null;
  billingClosingDay: number | null;
  creditLimit: number | null;
  bankSlug: string | null;
};

export type CreateAccountRequest = {
  name: string;
  type: AccountType;
  goalAmount?: number | null;
  isDefaultAccount: boolean;
  billingDueDay?: number | null;
  billingClosingDay?: number | null;
  creditLimit?: number | null;
  bankSlug?: string | null;
  initialBalance?: number | null;
};

export type UpdateAccountRequest = {
  id: number;
  name: string;
  type: AccountType;
  goalAmount?: number | null;
  isDefaultAccount: boolean;
  billingDueDay?: number | null;
  billingClosingDay?: number | null;
  creditLimit?: number | null;
  bankSlug?: string | null;
  newBalance?: number | null;
};

export type DeleteAccountRequest = {
  password: string;
};

export type BalanceHistoryItem = {
  date: string;
  balance: number;
};
