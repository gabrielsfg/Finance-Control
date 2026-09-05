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
import { ProfileFeedbackCard } from "@/features/profile/components/ProfileFeedbackCard";
import { ProfileRiskProfileCard } from "@/features/profile/components/ProfileRiskProfileCard";
import { ProfileAiContextCard } from "@/features/profile/components/ProfileAiContextCard";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useAuthStore } from "@/lib/stores/authStore";

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const logout = useAuthStore((s) => s.logout);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--brand-accent)]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-[14px] text-[var(--text-sub)]">Erro ao carregar perfil. Tente novamente.</p>
        {/* The app's only logout button lives further down this page, inside a card that
            never renders when the profile request fails — which is exactly what a dead
            session does. Repeat it here so the way out survives the failure. */}
        <button
          onClick={logout}
          className="inline-flex items-center justify-center rounded-[13px] border border-[var(--text)] px-[18px] py-2.5 text-[14px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--text)] hover:text-[var(--bg)]"
        >
          Sair da conta
        </button>
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
          <ProfileRiskProfileCard />
          <ProfileAiContextCard />
        </div>

        {/* Side column — plan + security */}
        <div className="col-span-12 flex flex-col gap-[22px] lg:col-span-4">
          <ProfilePlanCard />
          <ProfileTwoFactorCard profile={profile} />
          <ProfileDataExportCard />
          <ProfileFeedbackCard />
          <ProfileDangerZoneCard />
        </div>
      </div>
    </div>
  );
}
