export type UserProfile = {
  id: number;
  name: string;
  email: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  /** Which features the account is entitled to. */
  /** The plan the account can use right now; null without an active subscription. */
  plan: "Basic" | "Premium" | null;
  /** The user's own switch for the in-app AI features (analyses, chat, import categorisation). */
  aiEnabled: boolean;
};

export type UpdateProfileRequest = {
  name?: string;
  email?: string;
};

export type UserPreferences = {
  currencyCode: string;
  locale: string;
  country: string | null;
  analyticsConfig: string;
};

export type UpdatePreferencesRequest = {
  currencyCode?: string;
  locale?: string;
  country?: string;
  analyticsConfig?: string;
};

export type ResetDataRequest = {
  password: string;
};
