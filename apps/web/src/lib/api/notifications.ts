import { api } from "./axios";
import type {
  NotificationItem,
  UnreadNotificationCount,
  NotificationPreferences,
  UpdateNotificationPreferencesRequest,
} from "@/lib/types/notifications.types";

export const notificationsApi = {
  getAll: async (): Promise<NotificationItem[]> => {
    const res = await api.get<NotificationItem[]>("/notification");
    return res.data;
  },

  getUnreadCount: async (): Promise<UnreadNotificationCount> => {
    const res = await api.get<UnreadNotificationCount>("/notification/unread-count");
    return res.data;
  },

  // Mutations return the full updated list (project convention).
  markAsRead: async (id: number): Promise<NotificationItem[]> => {
    const res = await api.patch<NotificationItem[]>(`/notification/${id}/read`);
    return res.data;
  },

  markAllRead: async (): Promise<NotificationItem[]> => {
    const res = await api.post<NotificationItem[]>("/notification/read-all");
    return res.data;
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const res = await api.get<NotificationPreferences>("/notification/preferences");
    return res.data;
  },

  updatePreferences: async (
    data: UpdateNotificationPreferencesRequest,
  ): Promise<NotificationPreferences> => {
    const res = await api.patch<NotificationPreferences>("/notification/preferences", data);
    return res.data;
  },
};
