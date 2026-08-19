"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { BrandMark } from "@/components/shared/BrandMark";
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

function LoginPageContent() {
  const searchParams = useSearchParams();

  // The landing's "Criar conta" buttons deep-link straight into the register
  // tab. Read once as the initial value — after mount the tab is the user's.
  const [tab, setTab] = useState<"login" | "register">(
    searchParams.get("mode") === "register" ? "register" : "login",
  );
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
      <div className="relative hidden min-h-screen w-[55%] flex-col overflow-hidden border-r border-[var(--border-color)] bg-[var(--surface)] p-10 lg:flex">
        {/* Ambient gradient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 110%, color-mix(in oklab, var(--moss) 12%, transparent), transparent), radial-gradient(ellipse 60% 40% at 80% 20%, color-mix(in oklab, var(--brand-cobalt) 12%, transparent), transparent)",
          }}
        />

        <BrandMark className="relative z-10" glyphSize={34} textSize={21} />

        {/* Content */}
        <div className="relative z-10 flex max-w-[440px] flex-1 flex-col justify-center pb-4">
          <h2 className="font-display mb-4 text-[38px] leading-[1.1] font-extrabold tracking-[-0.03em] text-[var(--text)]">
            Dinheiro sob controle, <span className="text-[var(--brand-accent)]">de verdade</span>
          </h2>
          <p className="text-[15px] leading-relaxed text-[var(--text-sub)]">
            Contas, cartões, orçamento, metas e investimentos na mesma tela. Você lança uma vez e
            enxerga o mês inteiro — sem planilha, sem complexidade.
          </p>

          {/* What you get, stated plainly. No metrics here: the honest ones
              would be the app's own, and the app's numbers are the user's. */}
          <ul className="mt-10 flex flex-col gap-4">
            {[
              {
                title: "Pronto para usar no primeiro acesso",
                body: "A conta já nasce com categorias e uma carteira configuradas.",
              },
              {
                title: "Parcelas e recorrências no automático",
                body: "Lance uma vez; o app repete e divide nas datas certas.",
              },
              {
                title: "Seus dados saem quando você quiser",
                body: "Exportação completa da conta e CSV das transações.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <Check size={16} className="mt-[3px] shrink-0 text-[var(--moss)]" />
                <div>
                  <p className="text-[14px] font-semibold text-[var(--text)]">{item.title}</p>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed text-[var(--text-sub)]">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 py-10 lg:px-12">
        {/* Mobile logo */}
        <BrandMark className="mb-8 lg:hidden" glyphSize={30} textSize={18} />

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

export const LoginPage = () => (
  // useSearchParams forces client rendering up to the nearest boundary; the
  // fallback matches the page's background so the swap doesn't flash.
  <Suspense fallback={<div className="flex flex-1" />}>
    <LoginPageContent />
  </Suspense>
);
