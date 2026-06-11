import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";
import type {
  NotificationItem,
  UnreadNotificationCount,
  UpdateNotificationPreferencesRequest,
} from "@/lib/types/notifications.types";

const LIST_KEY = ["notifications"] as const;
const COUNT_KEY = ["notifications", "unread-count"] as const;

// Keeps both caches in sync after a mutation returns the updated list.
const syncCaches = (
  queryClient: ReturnType<typeof useQueryClient>,
  list: NotificationItem[],
) => {
  queryClient.setQueryData(LIST_KEY, list);
  queryClient.setQueryData<UnreadNotificationCount>(COUNT_KEY, {
    count: list.filter((n) => !n.isRead).length,
  });
};

// Full list — only fetched while the dropdown is open.
export const useNotifications = (enabled: boolean) =>
  useQuery({
    queryKey: LIST_KEY,
    queryFn: notificationsApi.getAll,
    enabled,
  });

// Lightweight unread count — polled continuously to drive the bell badge.
export const useUnreadNotificationCount = () =>
  useQuery({
    queryKey: COUNT_KEY,
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: (list) => syncCaches(queryClient, list),
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: (list) => syncCaches(queryClient, list),
  });
};

const PREFERENCES_KEY = ["notification-preferences"] as const;

export const useNotificationPreferences = () =>
  useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: notificationsApi.getPreferences,
    staleTime: 60_000,
  });

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateNotificationPreferencesRequest) =>
      notificationsApi.updatePreferences(data),
    onSuccess: (updated) => queryClient.setQueryData(PREFERENCES_KEY, updated),
  });
};
