export type UserProfile = {
  id: number;
  name: string;
  email: string;
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
