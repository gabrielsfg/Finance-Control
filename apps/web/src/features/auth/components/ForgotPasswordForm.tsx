"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/features/auth/schemas/authSchema";
import { authApi } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

export const ForgotPasswordForm = ({
  defaultEmail,
  onCodeSent,
  onBack,
}: {
  defaultEmail?: string;
  onCodeSent: (email: string) => void;
  onBack: () => void;
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: defaultEmail ?? "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(data.email);
      // The API answers the same way for an address that does not exist, so the next
      // screen makes no claim about whether an account was found.
      onCodeSent(data.email);
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status;
      setServerError(
        status === 429
          ? "Muitas tentativas. Aguarde alguns minutos e tente novamente."
          : "Não foi possível enviar o código. Tente novamente.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="bg-brand/10 text-brand mb-4 flex h-11 w-11 items-center justify-center rounded-[12px]">
        <KeyRound size={20} />
      </div>

      <h3 className="font-display font-700 text-text text-[22px]">Esqueceu a senha?</h3>
      <p className="text-text-sub mt-1 mb-6 text-[13px] leading-relaxed">
        Informe seu e-mail e enviaremos um código para você cadastrar uma nova senha.
      </p>

      <div className="mb-4">
        <label className="text-text-muted mb-1.5 block text-[13px]">E-mail</label>
        <input
          type="email"
          placeholder="gabriel@email.com"
          autoComplete="email"
          autoFocus
          {...register("email")}
          className={cn(
            "bg-surface2 text-text placeholder:text-text-muted w-full rounded-[9px] border px-[14px] py-[11px] font-sans text-[14px] focus:outline-none",
            errors.email ? "border-red" : "border-border focus:border-green",
          )}
        />
        {errors.email && <p className="text-red mt-1 text-[13px]">{errors.email.message}</p>}
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
        Enviar código
      </button>

      <button
        type="button"
        onClick={onBack}
        className="text-text-muted hover:text-text-sub mt-5 flex w-full items-center justify-center gap-1.5 text-[13px]"
      >
        <ArrowLeft size={13} />
        Voltar para o login
      </button>
    </form>
  );
};
