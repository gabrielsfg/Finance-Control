import type { AccountType } from "@/lib/types/accounts.types";

export type BankConnectionStatus =
  | "Syncing"
  | "Active"
  | "PartiallyUpdated"
  | "Outdated"
  | "NeedsReconnect"
  | "WaitingUser"
  | "Disconnected";

export type BankAccountLinkStatus = "PendingLink" | "Linked" | "Ignored";

export type BankAccountLinkAction = "Create" | "Link" | "Ignore";

export type OpenFinanceStatus = {
  /** The feature is switched on and the provider is configured. */
  available: boolean;
  /** The user has a subscription, so may connect banks. */
  hasAccess: boolean;
  plan: "Basic" | "Premium" | null;
  /** Banks the plan allows connected at once; null means no limit (Premium). */
  maxConnections: number | null;
  activeConnections: number;
  /** Synced transactions the user has not confirmed yet. */
  pendingReviewCount: number;
  connectionsNeedingAttention: number;
};

export type BankConnectionAccount = {
  id: number;
  name: string;
  number: string | null;
  /** Provider type: "BANK" or "CREDIT". */
  externalType: string;
  externalSubtype: string | null;
  suggestedAccountType: AccountType;
  status: BankAccountLinkStatus;
  accountId: number | null;
  accountName: string | null;
  importFromDate: string | null;
  initialImportCompletedAt: string | null;
  /** Cents, as the bank reports it (a card: the used limit). */
  externalBalance: number | null;
  externalBalanceAt: string | null;
  externalCreditLimit: number | null;
  /** Cents, computed from the app's transactions. */
  appBalance: number | null;
  /** Cents to add to the app balance to match the bank; null when they match. */
  balanceDifference: number | null;
};

export type BankConnection = {
  id: number;
  connectorId: number;
  connectorName: string;
  connectorImageUrl: string | null;
  connectorPrimaryColor: string | null;
  status: BankConnectionStatus;
  lastErrorMessage: string | null;
  lastSyncedAt: string | null;
  nextAutoSyncAt: string | null;
  consentExpiresAt: string | null;
  consentExpiringSoon: boolean;
  /** When "sync now" is allowed again; null means now. */
  manualSyncAvailableAt: string | null;
  isImporting: boolean;
  createdAt: string;
  accounts: BankConnectionAccount[];
};

export type ConnectToken = {
  accessToken: string;
  includeSandbox: boolean;
  /** Set when reconnecting: the widget opens in update mode on this item. */
  updateItemId: string | null;
};

export type LinkBankAccountItem = {
  bankAccountId: number;
  action: BankAccountLinkAction;
  accountId?: number | null;
  name?: string | null;
  importFromDate?: string | null;
};
