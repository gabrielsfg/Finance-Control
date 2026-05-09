export type AccountType = "Debit" | "Checking" | "Savings" | "Credit" | "Cash";

export type AccountItem = {
  id: number;
  name: string;
  type: AccountType;
  currentAmount: number;
  isDefaultAccount: boolean;
  creditLimit?: number | null;
};

export type AccountDetail = {
  id: number;
  name: string;
  type: AccountType;
  currentAmount: number;
  goalAmount: number | null;
  isDefaultAccount: boolean;
  billingDueDay: number | null;
  creditLimit: number | null;
};

export type CreateAccountRequest = {
  name: string;
  type: AccountType;
  goalAmount?: number | null;
  isDefaultAccount: boolean;
  billingDueDay?: number | null;
  creditLimit?: number | null;
  initialBalance?: number | null;
};

export type UpdateAccountRequest = {
  id: number;
  name: string;
  type: AccountType;
  goalAmount?: number | null;
  isDefaultAccount: boolean;
  billingDueDay?: number | null;
  creditLimit?: number | null;
  newBalance?: number | null;
};

export type DeleteAccountRequest = {
  password: string;
};

export type BalanceHistoryItem = {
  date: string;
  balance: number;
};
