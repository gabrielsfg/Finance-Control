"use client";

import { useState } from "react";
import { TriangleAlert, Eye, EyeOff } from "lucide-react";
import { useResetData } from "@/features/profile/hooks/useProfile";
import { useAuthStore } from "@/lib/stores/authStore";

const inputCls =
  "border-red/30 bg-red/5 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-red/60 transition-colors";

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
        onSuccess: () => logout(),
        onError: () => setError("Senha incorreta. Tente novamente."),
      },
    );
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPassword("");
    setError(null);
    setShowPassword(false);
  };

  return (
    <div className="rounded-2xl border border-red/40 bg-red/5 p-5">
      <p className="text-[11px] font-semibold tracking-widest text-red uppercase mb-3">
        Zona de Perigo
      </p>

      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-red/20 bg-red/5 p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <TriangleAlert size={13} className="text-red shrink-0" />
            <p className="text-text text-[13px] font-medium">Resetar dados da conta</p>
          </div>
          <p className="text-text-muted text-[12px] leading-relaxed">
            Remove permanentemente todas as transações, contas, orçamentos, investimentos, metas e
            categorias. Sua conta é preservada. Esta ação não pode ser desfeita.
          </p>
        </div>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="border-red/40 text-red hover:bg-red/10 w-full rounded-lg border py-2 text-[13px] font-medium transition-colors"
          >
            Resetar dados
          </button>
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

            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="border-border text-text-sub hover:text-text flex-1 rounded-lg border py-2 text-[13px] font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={isPending || !password.trim()}
                className="bg-red hover:bg-red/90 disabled:opacity-50 flex-1 rounded-lg py-2 text-[13px] font-medium text-white transition-colors"
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
