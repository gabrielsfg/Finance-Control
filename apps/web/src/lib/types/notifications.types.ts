export type NotificationType =
  | "System"
  | "RecurrenceCharged"
  | "RecurrenceUpcoming"
  | "CardDueSoon"
  | "CardClosingSoon"
  | "BudgetThreshold"
  | "BudgetExceeded"
  | "PriceAlert"
  | "GoalReached";

export type NotificationItem = {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

export type UnreadNotificationCount = {
  count: number;
};

export type NotificationPreferences = {
  recurrenceChargedEnabled: boolean;
  cardDueEnabled: boolean;
  cardDueDaysAhead: number;
  cardClosingEnabled: boolean;
  cardClosingDaysAhead: number;
  budgetAlertEnabled: boolean;
  budgetWarningPercent: number;
};

export type UpdateNotificationPreferencesRequest = NotificationPreferences;
