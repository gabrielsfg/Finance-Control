"use client";

import { useState } from "react";
import { Card } from "@/components/shared/Card";
import { useUpdateProfile } from "@/features/profile/hooks/useProfile";
import type { UserProfile } from "@/lib/types/profile.types";

type Props = { profile: UserProfile };

export const ProfileAvatarCard = ({ profile }: Props) => {
  const [name, setName] = useState(profile.name);
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const initials =
    profile.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") || profile.email[0]?.toUpperCase();

  const isDirty = name.trim().length > 0 && name.trim() !== profile.name;

  const handleSave = () => {
    if (isDirty) updateProfile({ name: name.trim() });
  };

  return (
    <Card>
      {/* Identity row */}
      <div className="mb-[22px] flex items-center gap-4">
        <div
          className="grid h-16 w-16 flex-none place-items-center rounded-[18px] font-display text-[26px] font-bold text-white"
          style={{ background: "linear-gradient(140deg, var(--brand-cobalt), #0c1f9c)" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-[20px] font-bold tracking-[-0.01em] text-[var(--text)]">
              {profile.name}
            </span>
            <span
              className="rounded-full px-[11px] py-[5px] font-mono text-[11px] tracking-[0.06em]"
              style={{ background: "color-mix(in srgb, var(--gold) 18%, transparent)", color: "var(--gold)" }}
            >
              Free
            </span>
          </div>
          <div className="mt-[3px] font-mono text-[11px] text-[var(--text-sub)]">{profile.email}</div>
        </div>
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <Field label="Nome">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-0 bg-transparent font-sans text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </Field>
        <Field label="E-mail" disabled>
          <input
            value={profile.email}
            disabled
            className="w-full cursor-not-allowed border-0 bg-transparent font-sans text-[15px] text-[var(--text-sub)] outline-none"
          />
        </Field>
      </div>

      {/* Actions */}
      <div className="mt-[22px] flex items-center gap-2.5">
        <button
          onClick={handleSave}
          disabled={isPending || !isDirty}
          className="inline-flex items-center rounded-[13px] px-[18px] py-2.5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-[1px] disabled:translate-y-0 disabled:opacity-50"
          style={{ background: "var(--brand-cobalt)", boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)" }}
        >
          {isPending ? "Salvando…" : "Salvar alterações"}
        </button>
        <button
          onClick={() => setName(profile.name)}
          disabled={isPending || !isDirty}
          className="inline-flex items-center rounded-[13px] bg-[var(--surface2)] px-[18px] py-2.5 text-[14px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--border-color)] disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </Card>
  );
};

/** Form field — mono uppercase label + bordered input with focus halo. */
function Field({
  label,
  disabled,
  children,
}: {
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">{label}</label>
      <div
        className={
          "flex items-center gap-2 rounded-[13px] border bg-[var(--surface)] px-3.5 py-2.5 transition-[border-color,box-shadow] " +
          (disabled
            ? "border-[var(--border-color)] opacity-80"
            : "border-[var(--border-color)] focus-within:border-[var(--brand-cobalt)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]")
        }
      >
        {children}
      </div>
    </div>
  );
}
