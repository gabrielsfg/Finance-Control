import type { AssetType } from "@/lib/types/investments.types";

export type GoalType = "Item" | "Investment";
export type GoalPriority = "Low" | "Medium" | "High";
export type GoalStatus = "Active" | "Achieved" | "Cancelled";
export type TransactionType = "Income" | "Expense" | "Transfer";

export type GoalTransaction = {
  id: number;
  amount: number;
  type: TransactionType;
  description: string;
  transactionDate: string;
};

export type Goal = {
  id: number;
  name: string;
  description: string | null;
  type: GoalType;
  targetAmount: number;
  priority: GoalPriority;
  status: GoalStatus;
  color: string | null;
  url: string | null;
  imageUrl: string | null;
  targetDate: string;
  targetAssetType: AssetType | null;
  targetTicker: string | null;
  currentAmount: number | null;
  includeInNetWorth: boolean;
  achievedAt: string | null;
  accountId: number | null;
  createdAt: string;
  updatedAt: string | null;
};

export type GoalDetail = Goal & {
  transactions: GoalTransaction[];
};

export type CreateGoalRequest = {
  name: string;
  description?: string;
  type: GoalType;
  targetAmount: number;
  priority?: GoalPriority;
  color?: string;
  url?: string;
  imageUrl?: string;
  targetDate: string;
  targetAssetType?: AssetType;
  targetTicker?: string;
};

export type UpdateGoalRequest = {
  name?: string;
  description?: string;
  targetAmount?: number;
  priority?: GoalPriority;
  status?: GoalStatus;
  color?: string;
  url?: string;
  imageUrl?: string;
  targetDate?: string;
  targetAssetType?: AssetType;
  targetTicker?: string;
  includeInNetWorth?: boolean;
};

export type ContributeGoalRequest = {
  amount: number;
  sourceAccountId?: number;
  description?: string;
};

export type WithdrawGoalRequest = {
  amount: number;
  destinationAccountId?: number;
  description?: string;
};

export type PurchaseGoalRequest = {
  subCategoryId: number;
  description?: string;
};

export type DeleteGoalRequest = {
  returnToAccountId?: number;
};

export type GoalInvestmentTransaction = {
  id: number;
  investmentId: number;
  ticker: string;
  name: string;
  operation: "Buy" | "Sell";
  date: string;
  quantity: number;
  unitPrice: number;
  otherCosts: number;
  totalValue: number;
};
