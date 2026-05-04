export type UserPlan = "Free" | "Premium";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  plan: UserPlan;
  createdAt: string;
  currency: string;
  language: string;
  notificationsEnabled: boolean;
};
