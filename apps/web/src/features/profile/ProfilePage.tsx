"use client";

import { Loader2 } from "lucide-react";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { ProfileAvatarCard } from "@/features/profile/components/ProfileAvatarCard";
import { ProfilePlanCard } from "@/features/profile/components/ProfilePlanCard";
import { ProfileDangerZoneCard } from "@/features/profile/components/ProfileDangerZoneCard";
import { ProfileDataExportCard } from "@/features/profile/components/ProfileDataExportCard";
import { ProfileTwoFactorCard } from "@/features/profile/components/ProfileTwoFactorCard";
import { ProfilePreferencesCard } from "@/features/profile/components/ProfilePreferencesCard";
import { ProfileNotificationsCard } from "@/features/profile/components/ProfileNotificationsCard";
import { ProfileDefaultAccountCard } from "@/features/profile/components/ProfileDefaultAccountCard";
import { useProfile } from "@/features/profile/hooks/useProfile";

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--brand-accent)]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[14px] text-[var(--text-sub)]">Erro ao carregar perfil. Tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
      <PageTopbar title="Perfil" subtitle={profile.name || profile.email} />

      <div className="grid grid-cols-12 gap-[22px]">
        {/* Main column — personal data + preferences */}
        <div className="col-span-12 flex flex-col gap-[22px] lg:col-span-8">
          <ProfileAvatarCard profile={profile} />
          <ProfilePreferencesCard />
          <ProfileNotificationsCard />
          <ProfileDefaultAccountCard />
        </div>

        {/* Side column — plan + security */}
        <div className="col-span-12 flex flex-col gap-[22px] lg:col-span-4">
          <ProfilePlanCard />
          <ProfileTwoFactorCard profile={profile} />
          <ProfileDataExportCard />
          <ProfileDangerZoneCard />
        </div>
      </div>
    </div>
  );
}
