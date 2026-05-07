"use client";

import { Loader2 } from "lucide-react";
import { ProfileAvatarCard } from "@/features/profile/components/ProfileAvatarCard";
import { ProfilePlanCard } from "@/features/profile/components/ProfilePlanCard";
import { ProfileDangerZoneCard } from "@/features/profile/components/ProfileDangerZoneCard";
import { ProfilePreferencesCard } from "@/features/profile/components/ProfilePreferencesCard";
import { ProfileNotificationsCard } from "@/features/profile/components/ProfileNotificationsCard";
import { ProfileDefaultAccountCard } from "@/features/profile/components/ProfileDefaultAccountCard";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useAuthStore } from "@/lib/stores/authStore";

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const logout = useAuthStore((s) => s.logout);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="text-green animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-sub text-[14px]">Erro ao carregar perfil. Tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">
          Perfil e Preferências
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <ProfileAvatarCard profile={profile} />
          <ProfilePlanCard />
          <ProfileDangerZoneCard />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <ProfilePreferencesCard />
          <ProfileNotificationsCard />
          <ProfileDefaultAccountCard />

          <div className="flex justify-end">
            <button
              onClick={logout}
              className="text-text-muted hover:text-text-sub text-[13px] font-medium transition-colors"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
