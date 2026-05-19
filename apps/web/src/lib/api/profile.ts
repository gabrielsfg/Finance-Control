import { api } from "./axios";
import type {
  UserProfile,
  UpdateProfileRequest,
  UserPreferences,
  UpdatePreferencesRequest,
  ResetDataRequest,
} from "@/lib/types/profile.types";

export const profileApi = {
  get: async (): Promise<UserProfile> => {
    const res = await api.get<UserProfile>("/user/profile");
    return res.data;
  },

  update: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const res = await api.patch<UserProfile>("/user/profile", data);
    return res.data;
  },

  getPreferences: async (): Promise<UserPreferences> => {
    const res = await api.get<UserPreferences>("/user/preferences");
    return res.data;
  },

  updatePreferences: async (data: UpdatePreferencesRequest): Promise<UserPreferences> => {
    const res = await api.patch<UserPreferences>("/user/preferences", data);
    return res.data;
  },

  resetData: async (data: ResetDataRequest): Promise<void> => {
    await api.post("/user/me/reset-data", data);
  },
};
