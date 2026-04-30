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

export type PriceHistoryEntry = {
  date: string;
  price: number;
};

export type WishlistItem = {
  id: number;
  name: string;
  targetPrice: number;
  currentPrice: number | null;
  url: string | null;
  priority: "Low" | "Medium" | "High";
  createdAt: string;
  notes: string | null;
  priceHistory: PriceHistoryEntry[];
};
