import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/lib/api/profile";
import type { UpdateProfileRequest, UpdatePreferencesRequest, ResetDataRequest } from "@/lib/types/profile.types";

export const useProfile = () =>
  useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.get,
    staleTime: 60_000,
  });

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileApi.update(data),
    onSuccess: (updated) => queryClient.setQueryData(["profile"], updated),
  });
};

export const usePreferences = () =>
  useQuery({
    queryKey: ["preferences"],
    queryFn: profileApi.getPreferences,
    staleTime: 60_000,
  });

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePreferencesRequest) => profileApi.updatePreferences(data),
    onSuccess: (updated) => queryClient.setQueryData(["preferences"], updated),
  });
};

export const useResetData = () =>
  useMutation({
    mutationFn: (data: ResetDataRequest) => profileApi.resetData(data),
  });
