"use client";

import { useState } from "react";
import { TriangleAlert, Eye, EyeOff } from "lucide-react";
import { Card, CardHead } from "@/components/shared/Card";
import { useDeleteUserAccount, useResetData } from "@/features/profile/hooks/useProfile";
import { useAuthStore } from "@/lib/stores/authStore";

type DangerAction = "reset" | "delete";

/** The API answers a failed refund with a billing code; anything else on 400 is the password. */
function dangerErrorMessage(err: unknown): string {
  const response = (err as { response?: { status?: number } })?.response;
  return response?.status === 503
    ? "Não conseguimos processar o reembolso da sua assinatura agora, então a conta foi mantida. Tente novamente em alguns minutos."
    : "Senha incorreta. Tente novamente.";
}

export const ProfileDangerZoneCard = () => {
  const [confirming, setConfirming] = useState<DangerAction | null>(null);
  const showConfirm = confirming !== null;
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: resetData, isPending: isResetting } = useResetData();
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteUserAccount();
  const isPending = isResetting || isDeleting;
  const logout = useAuthStore((s) => s.logout);

  const handleReset = () => {
    if (!password.trim()) {
      setError("Digite sua senha para confirmar.");
      return;
    }
    setError(null);
    const run = confirming === "delete" ? deleteAccount : resetData;
    run(
      { password },
      {
        onSuccess: () => logout("signedOut"),
        onError: (err) => setError(dangerErrorMessage(err)),
      },
    );
  };

  const handleCancel = () => {
    setConfirming(null);
    setPassword("");
    setError(null);
    setShowPassword(false);
  };

  return (
    <Card>
      <CardHead title="Segurança" />

      {/* Logout */}
      <button
        onClick={() => void logout("signedOut")}
        className="inline-flex w-full items-center justify-center rounded-[13px] border border-[var(--text)] px-[18px] py-2.5 text-[14px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--text)] hover:text-[var(--bg)]"
      >
        Sair da conta
      </button>

      <div className="my-[18px] h-px bg-[var(--border-color)]" />

      {/* Danger: reset data */}
      <div
        className="rounded-[13px] border p-3.5"
        style={{
          borderColor: "color-mix(in srgb, var(--clay) 35%, transparent)",
          background: "color-mix(in srgb, var(--clay) 7%, transparent)",
        }}
      >
        <div className="mb-1.5 flex items-center gap-2">
          <TriangleAlert size={14} strokeWidth={2.2} className="shrink-0 text-[var(--clay)]" />
          <p className="text-[13.5px] font-semibold text-[var(--text)]">Resetar dados da conta</p>
        </div>
        <p className="text-[12.5px] leading-relaxed text-[var(--text-sub)]">
          Remove permanentemente todas as transações, contas, orçamentos, investimentos, metas,
          categorias, etiquetas, alertas, conversas e análises da IA. Sua conta é preservada. Esta
          ação não pode ser desfeita.
        </p>
      </div>

      <div
        className="mt-3.5 rounded-[13px] border p-3.5"
        style={{
          borderColor: "color-mix(in srgb, var(--clay) 35%, transparent)",
          background: "color-mix(in srgb, var(--clay) 7%, transparent)",
        }}
      >
        <div className="mb-1.5 flex items-center gap-2">
          <TriangleAlert size={14} strokeWidth={2.2} className="shrink-0 text-[var(--clay)]" />
          <p className="text-[13.5px] font-semibold text-[var(--text)]">Excluir minha conta</p>
        </div>
        <p className="text-[12.5px] leading-relaxed text-[var(--text-sub)]">
          Exclui sua conta e todos os seus dados, desconecta os bancos e revoga as conexões de IA. A
          assinatura é encerrada: no plano anual, devolvemos os meses não iniciados (descontada a multa
          de 10%). Exporte seus dados antes, se quiser guardá-los.
        </p>
      </div>

      {!showConfirm ? (
        <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
          {(["reset", "delete"] as const).map((action) => (
            <button
              key={action}
              onClick={() => setConfirming(action)}
              className="inline-flex w-full items-center justify-center rounded-[13px] border px-[18px] py-2.5 text-[14px] font-semibold transition-colors"
              style={{
                borderColor: "color-mix(in srgb, var(--clay) 45%, transparent)",
                color: "var(--clay)",
              }}
            >
              {action === "reset" ? "Resetar dados" : "Excluir conta"}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3.5 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">
              Digite sua senha para confirmar
            </label>
            <div
              className="flex items-center gap-2 rounded-[13px] border px-3.5 py-2.5 transition-[border-color,box-shadow] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--clay)_12%,transparent)]"
              style={{ borderColor: "color-mix(in srgb, var(--clay) 35%, transparent)" }}
            >
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha atual"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                autoFocus
                className="w-full border-0 bg-transparent font-sans text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="shrink-0 text-[var(--text-sub)] transition-colors hover:text-[var(--text)]"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && <p className="text-[12px] text-[var(--clay)]">{error}</p>}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex-1 rounded-[13px] bg-[var(--surface2)] py-2.5 text-[14px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--border-color)] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleReset}
              disabled={isPending || !password.trim()}
              className="flex-1 rounded-[13px] py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--clay)" }}
            >
              {confirming === "delete"
                ? isPending ? "Excluindo…" : "Excluir definitivamente"
                : isPending ? "Resetando…" : "Confirmar reset"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
