"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import {
  verificationCodeSchema,
  type VerificationCodeFormData,
} from "@/features/auth/schemas/authSchema";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/authStore";
import { cn } from "@/lib/utils";
import { CodeField } from "./CodeField";

export const TwoFactorForm = ({
  challengeToken,
  onBack,
}: {
  challengeToken: string;
  onBack: () => void;
}) => {
  const router = useRouter();
  const { login } = useAuthStore();
  const [trustDevice, setTrustDevice] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerificationCodeFormData>({ resolver: zodResolver(verificationCodeSchema) });

  const onSubmit = async (data: VerificationCodeFormData) => {
    setServerError(null);
    try {
      // The trust token comes back as an HttpOnly cookie the browser stores on its own;
      // nothing to keep here.
      const response = await authApi.verifyTwoFactor({
        challengeToken,
        code: data.code,
        trustDevice,
      });
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
      <div className="bg-brand/10 text-brand mb-4 flex h-11 w-11 items-center justify-center rounded-[12px]">
        <ShieldCheck size={20} />
      </div>

      <h3 className="font-display font-700 text-text text-[22px]">Verificação em duas etapas</h3>
      <p className="text-text-sub mt-1 mb-6 text-[13px] leading-relaxed">
        Enviamos um código de 6 dígitos para o seu e-mail. Ele vale por 10 minutos.
      </p>

      <div className="mb-4">
        <CodeField
          autoFocus
          {...register("code")}
          className={cn(errors.code ? "border-red" : "border-border focus:border-green")}
        />
        {errors.code && <p className="text-red mt-1.5 text-[13px]">{errors.code.message}</p>}
      </div>

      <label className="text-text-sub mb-4 flex cursor-pointer items-center gap-2.5 text-[13px]">
        <input
          type="checkbox"
          checked={trustDevice}
          onChange={(event) => setTrustDevice(event.target.checked)}
          className="accent-brand h-[15px] w-[15px]"
        />
        Confiar neste dispositivo por 30 dias
      </label>

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
        Entrar na conta
      </button>

      {/* No resend here: a new code needs a fresh challenge token, which only the login
          call issues — so going back and signing in again is the resend. */}
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
