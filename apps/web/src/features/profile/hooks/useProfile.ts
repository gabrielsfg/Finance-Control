import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { profileApi } from "@/lib/api/profile";
import type { UpdateTwoFactorRequest } from "@/lib/types/auth.types";
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

export const useUpdateTwoFactor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTwoFactorRequest) => authApi.updateTwoFactor(data),
    // The endpoint answers 204, so there is nothing to write into the cache —
    // refetch the profile to pick up the new flag.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
};
