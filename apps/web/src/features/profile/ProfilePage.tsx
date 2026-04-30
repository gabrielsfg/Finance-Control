"use client";

import { Loader2 } from "lucide-react";
import { ProfileInfoCard } from "@/features/profile/components/ProfileInfoCard";
import { ProfilePlanCard } from "@/features/profile/components/ProfilePlanCard";
import { useProfile } from "@/features/profile/hooks/useProfile";

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

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
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Perfil</h1>
        <p className="text-text-muted mt-0.5 text-[13px]">{profile.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ProfileInfoCard profile={profile} />
        <ProfilePlanCard profile={profile} />
      </div>
    </div>
  );
}
