"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/features/auth/schemas/authSchema";
import { authApi } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import { CodeField } from "./CodeField";
import { ResendCodeButton } from "./ResendCodeButton";

export const ResetPasswordForm = ({
  email,
  onDone,
  onBack,
}: {
  email: string;
  onDone: () => void;
  onBack: () => void;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null);
    try {
      await authApi.resetPassword({ email, code: data.code, newPassword: data.password });
      // Every session died with the old password, so the user logs in again — on purpose.
      onDone();
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status;
      setServerError(
        status === 429
          ? "Muitas tentativas. Aguarde alguns minutos e tente novamente."
          : "Código inválido ou expirado.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="bg-brand/10 text-brand mb-4 flex h-11 w-11 items-center justify-center rounded-[12px]">
        <LockKeyhole size={20} />
      </div>

      <h3 className="font-display font-700 text-text text-[22px]">Nova senha</h3>
      <p className="text-text-sub mt-1 mb-6 text-[13px] leading-relaxed">
        Se existir uma conta para <span className="text-text">{email}</span>, o código chegou por
        e-mail. Ele vale por 15 minutos.
      </p>

      <div className="mb-4">
        <label className="text-text-muted mb-1.5 block text-[13px]">Código</label>
        <CodeField
          autoFocus
          {...register("code")}
          className={cn(errors.code ? "border-red" : "border-border focus:border-green")}
        />
        {errors.code && <p className="text-red mt-1.5 text-[13px]">{errors.code.message}</p>}
      </div>

      <div className="mb-3">
        <label className="text-text-muted mb-1.5 block text-[13px]">Nova senha</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            {...register("password")}
            className={cn(
              "bg-surface2 text-text placeholder:text-text-muted w-full rounded-[9px] border px-[14px] py-[11px] pr-10 font-sans text-[14px] focus:outline-none",
              errors.password ? "border-red" : "border-border focus:border-green",
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="text-text-muted hover:text-text-sub absolute top-1/2 right-3 -translate-y-1/2"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && <p className="text-red mt-1 text-[13px]">{errors.password.message}</p>}
      </div>

      <div className="mb-4">
        <label className="text-text-muted mb-1.5 block text-[13px]">Confirmar senha</label>
        <input
          type="password"
          placeholder="Repita a senha"
          autoComplete="new-password"
          {...register("confirmPassword")}
          className={cn(
            "bg-surface2 text-text placeholder:text-text-muted w-full rounded-[9px] border px-[14px] py-[11px] font-sans text-[14px] focus:outline-none",
            errors.confirmPassword ? "border-red" : "border-border focus:border-green",
          )}
        />
        {errors.confirmPassword && (
          <p className="text-red mt-1 text-[13px]">{errors.confirmPassword.message}</p>
        )}
      </div>

      {serverError && (
        <div className="border-red/30 bg-red/10 text-red mb-4 rounded-[8px] border px-4 py-3 text-[13px]">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand font-600 hover:bg-brand/90 flex w-full items-center justify-center gap-2 rounded-[9px] py-[13px] font-sans text-[15px] text-white transition-colors disabled:opacity-60"
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        Redefinir senha
      </button>

      <ResendCodeButton onResend={() => authApi.forgotPassword(email)} />

      <button
        type="button"
        onClick={onBack}
        className="text-text-muted hover:text-text-sub mt-4 flex w-full items-center justify-center gap-1.5 text-[13px]"
      >
        <ArrowLeft size={13} />
        Voltar para o login
      </button>
    </form>
  );
};
