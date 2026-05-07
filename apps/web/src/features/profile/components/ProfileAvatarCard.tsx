"use client";

import { useState } from "react";
import { User, Mail } from "lucide-react";
import { useUpdateProfile } from "@/features/profile/hooks/useProfile";
import type { UserProfile } from "@/lib/types/profile.types";

const inputCls =
  "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";

type Props = { profile: UserProfile };

export const ProfileAvatarCard = ({ profile }: Props) => {
  const [name, setName] = useState(profile.name);
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  const handleSave = () => {
    if (name.trim() && name.trim() !== profile.name) {
      updateProfile({ name: name.trim() });
    }
  };

  return (
    <div className="border-border bg-surface flex flex-col items-center gap-4 rounded-2xl border p-6 text-center">
      {/* Avatar */}
      <div className="from-purple to-blue flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br">
        <span className="font-display font-700 text-[24px] text-white">{initials}</span>
      </div>

      <div>
        <p className="font-display font-700 text-text text-[17px]">{profile.name}</p>
        <p className="text-text-muted mt-0.5 text-[12px]">{profile.email}</p>
      </div>

      {/* Edit fields */}
      <div className="w-full border-border border-t pt-4">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-text-muted mb-1.5 flex items-center gap-1.5 text-[11px]">
              <User size={11} /> Nome
            </label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-text-muted mb-1.5 flex items-center gap-1.5 text-[11px]">
              <Mail size={11} /> E-mail
            </label>
            <input className={inputCls} defaultValue={profile.email} disabled />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isPending || name.trim() === profile.name}
          className="bg-green hover:bg-green/90 disabled:opacity-50 mt-3 w-full rounded-lg py-2 text-[13px] font-medium text-black transition-colors"
        >
          {isPending ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
};
