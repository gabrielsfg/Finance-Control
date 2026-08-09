"use client";

import { useState } from "react";
import Link from "next/link";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { TwoFactorForm } from "@/features/auth/components/TwoFactorForm";
import { VerifyEmailForm } from "@/features/auth/components/VerifyEmailForm";
import type { LoginChallengeResponse } from "@/lib/types/auth.types";

/**
 * The screens that interrupt a login. They are steps of the same flow rather than
 * routes: putting them on their own URLs would mean parking a challenge token in the
 * address bar, and a refresh would land on a page whose state no longer exists.
 */
type ChallengeView =
  | { kind: "verify"; email: string }
  | { kind: "twoFactor"; challengeToken: string }
  | { kind: "forgot"; email: string }
  | { kind: "reset"; email: string };

export function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [view, setView] = useState<ChallengeView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const backToLogin = () => {
    setView(null);
    setTab("login");
  };

  const handleChallenge = (challenge: LoginChallengeResponse, email: string) => {
    setNotice(null);
    setView(
      challenge.challenge === "EmailNotVerified"
        ? { kind: "verify", email }
        : { kind: "twoFactor", challengeToken: challenge.challengeToken ?? "" },
    );
  };

  return (
    <div className="flex flex-1">
      {/* Left panel — branding */}
      <div className="border-border bg-surface relative hidden min-h-screen w-[55%] flex-col overflow-hidden border-r p-10 lg:flex">
        {/* Ambient gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 110%, rgba(0,201,141,0.07), transparent), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(124,111,224,0.07), transparent)",
          }}
        />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <div className="from-green to-purple flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br">
            <span className="font-display font-800 text-base text-black dark:text-white">C</span>
          </div>
          <span className="font-display font-700 text-text text-lg">Controle</span>
        </Link>

        {/* Content */}
        <div className="relative z-10 flex max-w-[440px] flex-1 flex-col justify-center pb-4">
          <h2 className="font-display font-800 text-text mb-4 text-[38px] leading-[1.1] tracking-[-0.03em]">
            Dinheiro sob controle,{" "}
            <em
              className="not-italic"
              style={{
                background: "linear-gradient(90deg, #00C98D, #4A9EFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              de verdade
            </em>
          </h2>
          <p className="text-text-sub mb-10 text-[15px] leading-relaxed">
            Conecte seus bancos, acompanhe investimentos e entenda seus gastos — tudo em um lugar.
            Sem planilha, sem complexidade.
          </p>

          {/* Testimonial */}
          <div className="border-border bg-surface2 rounded-[14px] border p-5">
            <p className="text-text-sub mb-3.5 text-[14px] leading-relaxed italic">
              "Em 3 meses usando o Controle, reduzi meus gastos com delivery em 60% e aumentei minha
              taxa de poupança para 40%. Finalmente sei para onde meu dinheiro vai."
            </p>
            <div className="flex items-center gap-2.5">
              <div className="from-purple to-blue flex h-8 w-8 items-center justify-center rounded-[8px] bg-gradient-to-br">
                <span className="font-display font-700 text-[12px] text-white">MS</span>
              </div>
              <div>
                <p className="font-600 text-text text-[13px]">Mariana Souza</p>
                <p className="text-text-muted text-[11px]">Designer, São Paulo</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 flex gap-7">
            <div>
              <p className="font-600 text-green font-mono text-[22px]">50k+</p>
              <p className="text-text-muted mt-0.5 text-[12px]">usuários ativos</p>
            </div>
            <div>
              <p className="font-600 text-green font-mono text-[22px]">R$ 2,1B</p>
              <p className="text-text-muted mt-0.5 text-[12px]">em transações geridas</p>
            </div>
            <div>
              <p className="font-600 text-green font-mono text-[22px]">4,9★</p>
              <p className="text-text-muted mt-0.5 text-[12px]">avaliação média</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 py-10 lg:px-12">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="from-green to-purple flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br">
            <span className="font-display font-800 text-sm text-black dark:text-white">C</span>
          </div>
          <span className="font-display font-700 text-text text-base">Controle</span>
        </Link>

        <div className="w-full max-w-[400px]">
          {/* Tabs — hidden mid-flow, where switching would drop the pending challenge. */}
          {view === null && (
            <div className="border-border bg-surface2 mb-7 flex rounded-[10px] border p-1">
              <button
                onClick={() => setTab("login")}
                className={`font-500 flex-1 rounded-[7px] py-[9px] font-sans text-[14px] transition-all duration-150 ${
                  tab === "login"
                    ? "bg-surface text-text shadow-sm"
                    : "text-text-muted hover:text-text-sub bg-transparent"
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => setTab("register")}
                className={`font-500 flex-1 rounded-[7px] py-[9px] font-sans text-[14px] transition-all duration-150 ${
                  tab === "register"
                    ? "bg-surface text-text shadow-sm"
                    : "text-text-muted hover:text-text-sub bg-transparent"
                }`}
              >
                Criar conta
              </button>
            </div>
          )}

          {view?.kind === "verify" && <VerifyEmailForm email={view.email} onBack={backToLogin} />}

          {view?.kind === "twoFactor" && (
            <TwoFactorForm challengeToken={view.challengeToken} onBack={backToLogin} />
          )}

          {view?.kind === "forgot" && (
            <ForgotPasswordForm
              defaultEmail={view.email}
              onCodeSent={(email) => setView({ kind: "reset", email })}
              onBack={backToLogin}
            />
          )}

          {view?.kind === "reset" && (
            <ResetPasswordForm
              email={view.email}
              onDone={() => {
                setNotice("Senha redefinida. Entre com a nova senha.");
                backToLogin();
              }}
              onBack={backToLogin}
            />
          )}

          {view === null &&
            (tab === "login" ? (
              <LoginForm
                onSwitch={() => setTab("register")}
                onChallenge={handleChallenge}
                onForgotPassword={(email) => setView({ kind: "forgot", email })}
                notice={notice}
              />
            ) : (
              <RegisterForm
                onSwitch={() => setTab("login")}
                onRegistered={(email) => setView({ kind: "verify", email })}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
