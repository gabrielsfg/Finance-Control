"use client";

import { useProfile } from "@/features/profile/hooks/useProfile";

/**
 * The account's entitlement, read from the profile the API already serves.
 *
 * `isLoading` matters to callers: a locked card flashed at a Premium user while the
 * profile is in flight reads as the subscription having lapsed, so gated surfaces wait
 * rather than guessing.
 */
export function usePlan() {
  const { data: profile, isLoading } = useProfile();
  return {
    plan: profile?.plan ?? null,
    isPremium: profile?.plan === "Premium",
    isLoading,
  };
}
