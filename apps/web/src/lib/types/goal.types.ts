import type { AssetType } from "@/lib/types/investments.types";

export type GoalType = "Item" | "Investment";
export type GoalPriority = "Low" | "Medium" | "High";
export type GoalStatus = "Active" | "Achieved" | "Cancelled";

export type GoalCheckpoint = {
  id: number;
  amount: number;
  recordedAt: string;
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
  latestCheckpointAmount: number | null;
  createdAt: string;
  updatedAt: string | null;
};

export type GoalDetail = Goal & {
  checkpoints: GoalCheckpoint[];
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
};
