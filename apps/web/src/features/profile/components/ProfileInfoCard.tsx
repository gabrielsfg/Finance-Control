"use client";

import { User, Mail, Calendar } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatDateFull } from "@/lib/utils/formatDate";
import type { UserProfile } from "@/lib/types/profile.types";

const inputCls = "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";

type Props = { profile: UserProfile };

export const ProfileInfoCard = ({ profile }: Props) => (
  <div className="border-border bg-surface rounded-xl border p-5">
    <SectionHeader title="Informações Pessoais" />

    <div className="mb-5 flex items-center gap-4">
      <div className="from-green to-purple flex h-16 w-16 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br">
        <span className="font-display font-700 text-[22px] text-white">
          {profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </span>
      </div>
      <div>
        <p className="font-display font-700 text-text text-[18px]">{profile.name}</p>
        <p className="text-text-muted text-[13px]">{profile.email}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${profile.plan === "Premium" ? "bg-purple/15 text-purple" : "bg-surface2 text-text-muted"}`}>
            {profile.plan}
          </span>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="text-text-muted mb-1.5 flex items-center gap-1.5 text-[12px]">
          <User size={12} /> Nome
        </label>
        <input className={inputCls} defaultValue={profile.name} />
      </div>
      <div>
        <label className="text-text-muted mb-1.5 flex items-center gap-1.5 text-[12px]">
          <Mail size={12} /> E-mail
        </label>
        <input className={inputCls} defaultValue={profile.email} disabled />
      </div>
      <div className="sm:col-span-2">
        <label className="text-text-muted mb-1.5 flex items-center gap-1.5 text-[12px]">
          <Calendar size={12} /> Membro desde
        </label>
        <input className={inputCls} value={formatDateFull(profile.createdAt)} disabled />
      </div>
    </div>

    <div className="mt-4 flex justify-end">
      <button className="bg-green hover:bg-green/90 rounded-lg px-4 py-2 text-[13px] font-medium text-black transition-colors">
        Salvar alterações
      </button>
    </div>
  </div>
);
