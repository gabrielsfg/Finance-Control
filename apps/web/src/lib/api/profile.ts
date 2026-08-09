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

  /**
   * Data portability. Comes back as a file, so the response is a blob and the
   * filename is read from Content-Disposition rather than invented here.
   */
  exportData: async (): Promise<{ blob: Blob; fileName: string }> => {
    const response = await api.get("/user/me/export", { responseType: "blob" });

    const disposition = response.headers["content-disposition"] as string | undefined;
    const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);

    return {
      blob: response.data as Blob,
      fileName: match ? decodeURIComponent(match[1]) : "meus-dados.json",
    };
  },
};
