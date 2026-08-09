"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/features/auth/schemas/authSchema";
import { authApi } from "@/lib/api/auth";
import { isLoginChallenge, type LoginChallengeResponse } from "@/lib/types/auth.types";
import { useAuthStore } from "@/lib/stores/authStore";
import { cn } from "@/lib/utils";

export const LoginForm = ({
  onSwitch,
  onChallenge,
  onForgotPassword,
  notice,
}: {
  onSwitch: () => void;
  /** The password was right but the login needs a code first. */
  onChallenge: (challenge: LoginChallengeResponse, email: string) => void;
  onForgotPassword: (email: string) => void;
  notice?: string | null;
}) => {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const result = await authApi.login(data);

      // 200 with a challenge is not an error: the credentials were accepted and the
      // flow simply has another step, so the page moves on instead of showing a failure.
      if (isLoginChallenge(result)) {
        onChallenge(result, data.email);
        return;
      }

      login(result.accessToken);
      router.refresh();
      router.push("/dashboard");
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status;
      if (status === 423) {
        setServerError("Conta bloqueada temporariamente. Tente novamente em instantes.");
      } else if (status === 429) {
        setServerError("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      } else if (status === 503) {
        // Credentials were accepted — only the code email failed. Saying "senha
        // inválida" here would send the user to reset a password that works.
        setServerError("Não conseguimos enviar seu código agora. Tente entrar novamente.");
      } else {
        setServerError("E-mail ou senha inválidos.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h3 className="font-display font-700 text-text text-[22px]">Bem-vindo de volta</h3>
      <p className="text-text-sub mt-1 mb-6 text-[13px]">Entre com sua conta para continuar</p>

      {notice && (
        <div className="border-green/30 bg-green/10 text-green mb-4 rounded-[8px] border px-4 py-3 text-[13px]">
          {notice}
        </div>
      )}

      {/* Email */}
      <div className="mb-3">
        <label className="text-text-muted mb-1.5 block text-[13px]">E-mail</label>
        <input
          type="email"
          placeholder="gabriel@email.com"
          autoComplete="email"
          {...register("email")}
          className={cn(
            "bg-surface2 text-text placeholder:text-text-muted w-full rounded-[9px] border px-[14px] py-[11px] font-sans text-[14px] focus:outline-none",
            errors.email ? "border-red" : "border-border focus:border-green",
          )}
        />
        {errors.email && <p className="text-red mt-1 text-[13px]">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div className="mb-1">
        <label className="text-text-muted mb-1.5 block text-[13px]">Senha</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            {...register("password")}
            className={cn(
              "bg-surface2 text-text placeholder:text-text-muted w-full rounded-[9px] border px-[14px] py-[11px] pr-10 font-sans text-[14px] focus:outline-none",
              errors.password ? "border-red" : "border-border focus:border-green",
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-text-muted hover:text-text-sub absolute top-1/2 right-3 -translate-y-1/2"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && <p className="text-red mt-1 text-[13px]">{errors.password.message}</p>}
      </div>

      {/* Carries whatever is already typed, so the next screen does not ask for it twice. */}
      <button
        type="button"
        onClick={() => onForgotPassword(getValues("email"))}
        className="text-text-sub hover:text-green mb-4 block w-full text-right text-[13px]"
      >
        Esqueci minha senha
      </button>

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

      <p className="text-text-muted mt-5 text-center text-[14px]">
        Não tem uma conta?{" "}
        <button type="button" onClick={onSwitch} className="font-500 text-green hover:underline">
          Criar conta grátis
        </button>
      </p>
    </form>
  );
};
