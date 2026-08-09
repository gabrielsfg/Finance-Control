"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Card, CardHead } from "@/components/shared/Card";
import { Switch } from "@/components/shared/Switch";
import { useUpdateTwoFactor } from "@/features/profile/hooks/useProfile";
import type { UserProfile } from "@/lib/types/profile.types";

/**
 * Two-factor toggle. Flipping the switch does not commit — turning a security control
 * on or off has to re-prove the password, so the switch only opens the confirmation.
 */
export const ProfileTwoFactorCard = ({ profile }: { profile: UserProfile }) => {
  const [pendingValue, setPendingValue] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: updateTwoFactor, isPending } = useUpdateTwoFactor();

  const cancel = () => {
    setPendingValue(null);
    setPassword("");
    setShowPassword(false);
    setError(null);
  };

  const confirm = () => {
    if (pendingValue === null) return;
    if (!password.trim()) {
      setError("Digite sua senha para confirmar.");
      return;
    }

    setError(null);
    updateTwoFactor(
      { enabled: pendingValue, password },
      {
        onSuccess: cancel,
        onError: () => setError("Senha incorreta. Tente novamente."),
      },
    );
  };

  // While confirming, the switch shows where it is going, not where it is.
  const displayedValue = pendingValue ?? profile.twoFactorEnabled;

  return (
    <Card>
      <CardHead title="Verificação em duas etapas" subtitle="Código por e-mail a cada novo login" />

      <div className="flex items-center gap-3.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
          style={{
            background: profile.twoFactorEnabled
              ? "color-mix(in srgb, var(--moss) 14%, transparent)"
              : "var(--surface2)",
            color: profile.twoFactorEnabled ? "var(--moss)" : "var(--text-sub)",
          }}
        >
          <ShieldCheck size={17} strokeWidth={2.1} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-[var(--text)]">
            {profile.twoFactorEnabled ? "Ativada" : "Desativada"}
          </div>
          <div className="mt-0.5 text-[13px] text-[var(--text-sub)]">
            {profile.twoFactorEnabled
              ? "Pedimos um código sempre que você entrar em um dispositivo novo"
              : "Adicione uma segunda camada além da senha"}
          </div>
        </div>

        <Switch
          value={displayedValue}
          onChange={setPendingValue}
          disabled={isPending}
          aria-label="Verificação em duas etapas"
        />
      </div>

      {pendingValue !== null && (
        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-color)] pt-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] tracking-[0.1em] text-[var(--text-sub)] uppercase">
              {pendingValue ? "Confirme para ativar" : "Confirme para desativar"}
            </label>
            <div className="flex items-center gap-2 rounded-[13px] border border-[var(--border-color)] px-3.5 py-2.5 transition-[border-color,box-shadow] focus-within:border-[var(--brand-cobalt)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha atual"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => event.key === "Enter" && confirm()}
                autoFocus
                autoComplete="current-password"
                className="w-full border-0 bg-transparent font-sans text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="shrink-0 text-[var(--text-sub)] transition-colors hover:text-[var(--text)]"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && <p className="text-[12px] text-[var(--clay)]">{error}</p>}
            {!pendingValue && (
              <p className="text-[12px] leading-relaxed text-[var(--text-sub)]">
                Os dispositivos confiáveis também serão removidos.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={cancel}
              disabled={isPending}
              className="flex-1 rounded-[13px] bg-[var(--surface2)] py-2.5 text-[14px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--border-color)] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirm}
              disabled={isPending || !password.trim()}
              className="flex-1 rounded-[13px] bg-[var(--brand-cobalt)] py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Salvando…" : "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
