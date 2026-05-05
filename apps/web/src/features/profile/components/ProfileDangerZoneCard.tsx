"use client";

import { useState } from "react";
import { TriangleAlert, Eye, EyeOff } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useResetData } from "@/features/profile/hooks/useProfile";
import { useAuthStore } from "@/lib/stores/authStore";

const inputCls =
  "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-red/60 transition-colors";

export const ProfileDangerZoneCard = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: resetData, isPending } = useResetData();
  const logout = useAuthStore((s) => s.logout);

  const handleReset = () => {
    if (!password.trim()) {
      setError("Digite sua senha para confirmar.");
      return;
    }
    setError(null);

    resetData(
      { password },
      {
        onSuccess: () => {
          logout();
        },
        onError: () => {
          setError("Senha incorreta. Tente novamente.");
        },
      }
    );
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPassword("");
    setError(null);
    setShowPassword(false);
  };

  return (
    <div className="border-red/30 bg-surface rounded-xl border p-5">
      <SectionHeader title="Zona de Perigo" />

      <div className="flex flex-col gap-4">
        <div className="bg-red/5 border-red/20 rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <TriangleAlert size={14} className="text-red shrink-0" />
            <p className="text-text text-[13px] font-medium">Resetar dados da conta</p>
          </div>
          <p className="text-text-muted text-[12px] leading-relaxed">
            Remove permanentemente todas as transações, contas, orçamentos, investimentos, metas e
            categorias personalizadas. Sua conta de acesso é preservada e os dados padrão são
            restaurados. Esta ação não pode ser desfeita.
          </p>
        </div>

        {!showConfirm ? (
          <div className="flex justify-end">
            <button
              onClick={() => setShowConfirm(true)}
              className="border-red/40 text-red hover:bg-red/10 rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors"
            >
              Resetar dados
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-text-muted mb-1.5 block text-[12px]">
                Digite sua senha para confirmar
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={inputCls}
                  placeholder="Sua senha atual"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-text-muted hover:text-text-sub absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {error && <p className="text-red mt-1.5 text-[12px]">{error}</p>}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="border-border text-text-sub hover:text-text rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={isPending || !password.trim()}
                className="bg-red hover:bg-red/90 disabled:opacity-50 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-colors"
              >
                {isPending ? "Resetando..." : "Confirmar reset"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
