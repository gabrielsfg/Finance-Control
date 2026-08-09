"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import {
  verificationCodeSchema,
  type VerificationCodeFormData,
} from "@/features/auth/schemas/authSchema";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/authStore";
import { cn } from "@/lib/utils";
import { CodeField } from "./CodeField";
import { ResendCodeButton } from "./ResendCodeButton";

export const VerifyEmailForm = ({ email, onBack }: { email: string; onBack: () => void }) => {
  const router = useRouter();
  const { login } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerificationCodeFormData>({ resolver: zodResolver(verificationCodeSchema) });

  const onSubmit = async (data: VerificationCodeFormData) => {
    setServerError(null);
    try {
      // Confirming the code is itself proof of the address, so the API signs the user
      // in here — there is no second trip through the login form.
      const response = await authApi.verifyEmail({ email, code: data.code });
      login(response.accessToken);
      router.refresh();
      router.push("/dashboard");
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
      <div className="bg-green/10 text-green mb-4 flex h-11 w-11 items-center justify-center rounded-[12px]">
        <MailCheck size={20} />
      </div>

      <h3 className="font-display font-700 text-text text-[22px]">Confirme seu e-mail</h3>
      <p className="text-text-sub mt-1 mb-6 text-[13px] leading-relaxed">
        Enviamos um código de 6 dígitos para <span className="text-text">{email}</span>. Ele vale
        por 15 minutos.
      </p>

      <div className="mb-4">
        <CodeField
          autoFocus
          {...register("code")}
          className={cn(errors.code ? "border-red" : "border-border focus:border-green")}
        />
        {errors.code && <p className="text-red mt-1.5 text-[13px]">{errors.code.message}</p>}
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
        Confirmar e entrar
      </button>

      <ResendCodeButton onResend={() => authApi.resendVerificationCode(email)} />

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
