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
  url: string | null;
  imageUrl: string | null;
  targetDate: string | null;
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
  url?: string;
  imageUrl?: string;
  targetDate?: string;
};

export type UpdateGoalRequest = {
  name?: string;
  description?: string;
  targetAmount?: number;
  priority?: GoalPriority;
  status?: GoalStatus;
  url?: string;
  imageUrl?: string;
  targetDate?: string;
};
