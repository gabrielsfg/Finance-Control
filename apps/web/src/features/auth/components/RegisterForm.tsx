"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  registerSchema,
  type RegisterFormData,
  getPasswordStrength,
} from "@/features/auth/schemas/authSchema";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/authStore";
import { cn } from "@/lib/utils";

export const RegisterForm = ({ onSwitch }: { onSwitch: () => void }) => {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const passwordStrength = getPasswordStrength(passwordValue);

  const strengthConfig = {
    fraca: { width: "w-1/3", color: "bg-red", label: "Fraca" },
    média: { width: "w-2/3", color: "bg-orange", label: "Média" },
    forte: { width: "w-full", color: "bg-green", label: "Forte" },
  } as const;

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const response = await authApi.register(data);
      login(response.accessToken, response.refreshToken);
      router.refresh();
      router.push("/dashboard");
    } catch {
      setServerError("Este e-mail já está em uso. Tente fazer login.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h3 className="font-display font-700 text-text text-[22px]">Criar sua conta</h3>
      <p className="text-text-sub mt-1 mb-6 text-[13px]">
        Comece gratuitamente, sem cartão de crédito
      </p>

      {/* Name */}
      <div className="mb-3">
        <label className="text-text-muted mb-1.5 block text-[13px]">Nome completo</label>
        <input
          type="text"
          placeholder="Gabriel Silva"
          autoComplete="name"
          {...register("name")}
          className={cn(
            "bg-surface2 text-text placeholder:text-text-muted w-full rounded-[9px] border px-[14px] py-[11px] font-sans text-[14px] focus:outline-none",
            errors.name ? "border-red" : "border-border focus:border-green",
          )}
        />
        {errors.name && <p className="text-red mt-1 text-[13px]">{errors.name.message}</p>}
      </div>

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
      <div className="mb-3">
        <label className="text-text-muted mb-1.5 block text-[13px]">Senha</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            {...register("password", {
              onChange: (e) => setPasswordValue(e.target.value),
            })}
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
        {passwordStrength && (
          <div className="mt-2">
            <div className="bg-surface2 h-1 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  strengthConfig[passwordStrength].width,
                  strengthConfig[passwordStrength].color,
                )}
              />
            </div>
            <p
              className={cn("mt-1 text-[12px]", {
                "text-red": passwordStrength === "fraca",
                "text-orange": passwordStrength === "média",
                "text-green": passwordStrength === "forte",
              })}
            >
              Força: {strengthConfig[passwordStrength].label}
            </p>
          </div>
        )}
        {errors.password && <p className="text-red mt-1 text-[13px]">{errors.password.message}</p>}
      </div>

      {/* Confirm Password */}
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
        className="bg-green font-600 hover:bg-green/90 flex w-full items-center justify-center gap-2 rounded-[9px] py-[13px] font-sans text-[15px] text-black transition-colors disabled:opacity-60"
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        Criar conta grátis
      </button>

      <p className="text-text-muted mt-4 text-center text-[12px] leading-relaxed">
        Ao criar uma conta, você concorda com os{" "}
        <a href="#" className="text-text-sub hover:text-green">
          Termos de Uso
        </a>{" "}
        e a{" "}
        <a href="#" className="text-text-sub hover:text-green">
          Política de Privacidade
        </a>
        .
      </p>

      <p className="text-text-muted mt-4 text-center text-[14px]">
        Já tem uma conta?{" "}
        <button type="button" onClick={onSwitch} className="font-500 text-green hover:underline">
          Entrar
        </button>
      </p>
    </form>
  );
};
